package global

import (
	"fmt"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Filter struct {
	Field   string `json:"field"`
	Filter  string `json:"filter"`
	Type    string `json:"type"`
	Value   any    `json:"value"`
	Options any    `json:"options"`
}

// Constructs a filter map for mongodb based on the user's filter-builder structure.
// Each query always has a root-or segment containing one or more and-segments.
func BuildFilter(filters [][]Filter) (bson.M, error) {
	if len(filters) == 0 {
		return bson.M{}, nil
	}

	hasFilters := false
	orFilters := []bson.M{}

	// Or-loop
	for o := range filters {
		andFilters := filters[o]

		if len(andFilters) > 0 {
			andFilter := []bson.M{}

			// And-loop
			for i := range andFilters {
				filter := andFilters[i]
				f, err := configureFilter(filter)

				if err != nil {
					return nil, err
				}
				m := bson.M{}
				m[filter.Field] = f
				andFilter = append(andFilter, m)
				hasFilters = true
			}

			orFilters = append(orFilters, bson.M{"$and": andFilter})
		}
	}

	if !hasFilters {
		return bson.M{}, nil
	}

	out := bson.M{"$or": orFilters}
	return out, nil
}

func configureFilter(filter Filter) (any, error) {
	switch filter.Type {
	case "text":
		return configureTextFilter(filter)
	case "date":
		return configureDateFilter(filter)
	case "enum":
		return configureEnumFilter(filter)
	default:
		return nil, fmt.Errorf("unsupported filter type '%s'", filter.Type)
	}
}

func configureTextFilter(filter Filter) (any, error) {
	switch filter.Filter {
	case "equals":
		r := bson.M{"$regex": primitive.Regex{Pattern: "^" + regexp.QuoteMeta(filter.Value.(string)) + "$", Options: "i"}}
		return r, nil
	case "contains":
		r := bson.M{"$regex": primitive.Regex{Pattern: regexp.QuoteMeta(filter.Value.(string)), Options: "i"}}
		return r, nil
	case "startsWith":
		r := bson.M{"$regex": primitive.Regex{Pattern: "^" + regexp.QuoteMeta(filter.Value.(string)), Options: "i"}}
		return r, nil
	case "endsWith":
		r := bson.M{"$regex": primitive.Regex{Pattern: regexp.QuoteMeta(filter.Value.(string)) + "$", Options: "i"}}
		return r, nil
	case "containsNot":
		r := bson.M{"$regex": primitive.Regex{Pattern: regexp.QuoteMeta(filter.Value.(string)), Options: "i"}}
		return bson.M{"$not": r}, nil
	case "startsNotWith":
		r := bson.M{"$regex": primitive.Regex{Pattern: "^" + regexp.QuoteMeta(filter.Value.(string)), Options: "i"}}
		return bson.M{"$not": r}, nil
	case "endsNotWith":
		r := bson.M{"$regex": primitive.Regex{Pattern: regexp.QuoteMeta(filter.Value.(string)) + "$", Options: "i"}}
		return bson.M{"$not": r}, nil
	default:
		return nil, fmt.Errorf("unsupported filter '%s'", filter.Filter)
	}
}

func configureEnumFilter(filter Filter) (any, error) {
	switch filter.Filter {
	case "is":
		val := filter.Value.(string)

		if id, err := primitive.ObjectIDFromHex(val); err == nil {
			return id, nil
		}

		return filter.Value.(string), nil
	case "not":
		val := filter.Value.(string)

		if id, err := primitive.ObjectIDFromHex(val); err == nil {
			return bson.M{"$ne": id}, nil
		}

		return bson.M{"$ne": filter.Value.(string)}, nil
	default:
		return nil, fmt.Errorf("unsupported filter '%s'", filter.Filter)
	}
}

func configureDateFilter(filter Filter) (any, error) {
	value := filter.Value.(map[string]any)
	options := filter.Options.(map[string]any)

	loc, err := time.LoadLocation(options["timeZone"].(string))
	if err != nil {
		return nil, err
	}

	from, err := time.Parse(time.RFC3339, value["from"].(string))
	if err != nil {
		return nil, err
	}

	switch filter.Filter {
	case "is":
		from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, loc)
		to := from.Add(24 * time.Hour)
		return bson.M{"$gte": from, "$lt": to}, nil
	case "after":
		from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, loc).Add(24 * time.Hour)
		return bson.M{"$gte": from}, nil
	case "before":
		from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, loc)
		return bson.M{"$lt": from}, nil
	case "between":
		from = time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, loc)
		toStr, ok := value["to"]

		if !ok {
			return bson.M{"$gte": from, "$lt": from}, nil
		}

		to, err := time.Parse(time.RFC3339, toStr.(string))
		if err != nil {
			return nil, err
		}

		to = time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, loc).Add(24 * time.Hour)
		return bson.M{"$gte": from, "$lt": to}, nil
	default:
		return nil, fmt.Errorf("unsupported filter '%s'", filter.Filter)
	}
}
