package global

import (
	"math"
	"time"
)

// Calculates the progress represented by currentTime in relation to startTime and now.
// Used to calculate the progress of a job based on the assumption that it does something with historic records
// starting some time in the past and making their way to the present time.
// Illustration:
// startTime - - - - - - - currentTime - - - now
//                         ^- = 75% (this is calculated and returned)
func TimeProgressToNow(startTime, currentTime int64) float64 {
	cTime := currentTime - startTime
	now := time.Now().UTC().Unix() - startTime
	return math.Min(100, float64(cTime)/float64(now)*100)
}
