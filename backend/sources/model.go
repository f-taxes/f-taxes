package sources

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const COL_SOURCES = "sources"

func Update(srcCon SourceConnection) error {
	col := DBConn.Collection(COL_SOURCES)

	if srcCon.ID.IsZero() {
		srcCon.ID = primitive.NewObjectID()
	}

	_, err := col.Upsert(context.Background(), bson.M{"_id": srcCon.ID}, srcCon)
	return err
}

func List() ([]SourceConnection, error) {
	col := DBConn.Collection(COL_SOURCES)
	list := []SourceConnection{}
	err := col.Find(context.Background(), bson.M{}).All(&list)
	return list, err
}

func OneById(srcID primitive.ObjectID) (SourceConnection, error) {
	srcCon := SourceConnection{}
	col := DBConn.Collection(COL_SOURCES)
	err := col.Find(context.Background(), bson.M{"_id": srcID}).One(&srcCon)
	return srcCon, err
}
