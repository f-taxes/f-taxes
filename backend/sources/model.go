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