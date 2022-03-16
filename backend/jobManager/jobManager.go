package jobmanager

import (
	"sync"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Job struct {
	sync.Mutex
	ID       primitive.ObjectID
	Label    string
	Progress float64
}

func (j *Job) Failed() {
	j.Lock()
	defer j.Unlock()
}

type JobManager struct {
	l           sync.Mutex
	cancelFuncs map[primitive.ObjectID]func()
}

func New() *JobManager {
	return &JobManager{
		cancelFuncs: make(map[primitive.ObjectID]func()),
	}
}

func (j *JobManager) Add(id primitive.ObjectID, cancelFn func()) {
	j.l.Lock()
	defer j.l.Unlock()

	j.cancelFuncs[id] = cancelFn
}

func (j *JobManager) Cancel(id primitive.ObjectID) {
	j.l.Lock()
	defer j.l.Unlock()

	if cancelFn, ok := j.cancelFuncs[id]; ok {
		cancelFn()
		delete(j.cancelFuncs, id)
	}
}

func (j *JobManager) Remove(id primitive.ObjectID) {
	j.l.Lock()
	defer j.l.Unlock()

	delete(j.cancelFuncs, id)
}
