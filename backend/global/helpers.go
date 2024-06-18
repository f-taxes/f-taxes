package global

// Search for one or more needles in the haystack.
// Returns true if any of the needles was found.
func ContainsAny[T comparable](haystack []T, needle ...T) bool {
	for _, n := range needle {
		for _, h := range haystack {
			if h == n {
				return true
			}
		}
	}

	return false
}
