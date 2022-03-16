package settings

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/qiniu/qmgo"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const COL_SETTINGS = "settings"

type UserSettings struct {
	ID             primitive.ObjectID `bson:"_id" json:"-"`
	DateTimeFormat string             `bson:"dateTimeFormat" json:"dateTimeFormat"`
}

func ensureDefaultSettings() {
	s, err := Get()

	if err != nil {
		golog.Errorf("Failed to get settings document from database: %v", err)
		return
	}

	if s.DateTimeFormat == "" {
		s.DateTimeFormat = "Pp"
	}

	err = Save(s)

	if err != nil {
		golog.Errorf("Failed to save default settings document from database: %v", err)
		return
	}
}

// We only use one document in the collection to store settings.
func Get() (UserSettings, error) {
	s := UserSettings{
		ID: primitive.NewObjectID(),
	}

	col := DBConn.Collection(COL_SETTINGS)
	err := col.Find(context.Background(), bson.M{}).One(&s)

	if qmgo.IsErrNoDocuments(err) {
		return s, nil
	}

	return s, err
}

// This code ensures we only store one document with settings.
func Save(updatedSettings UserSettings) error {
	s, err := Get()

	if err != nil {
		return err
	}

	updatedSettings.ID = s.ID

	col := DBConn.Collection(COL_SETTINGS)
	_, err = col.UpsertId(context.Background(), s.ID, updatedSettings)
	return err
}
