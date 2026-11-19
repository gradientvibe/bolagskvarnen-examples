// Search for a company and fetch its board from the Bolagskvarnen sandbox.
//
// Usage (Go 1.21 or later):
//
//	export BOLAGSKVARNEN_KEY=gb_test_...
//	go run . Exempelbolaget
//
// Needs a test key (fictional companies). Live data is not open yet.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type envelope[T any] struct {
	Status string    `json:"status"`
	Data   T         `json:"data"`
	Error  *apiError `json:"error"`
}

type hit struct {
	OrgNumber string `json:"org_number"`
	Name      string `json:"name"`
}

type role struct {
	Role     string `json:"role"`
	Name     string `json:"name"`
	FromDate string `json:"from_date"`
}

type roles struct {
	Roles           []role   `json:"roles"`
	SignatoryRights []string `json:"signatory_rights"`
}

var client = &http.Client{Timeout: 10 * time.Second}

func get[T any](base, key, path string) (T, error) {
	var zero T
	req, err := http.NewRequest("GET", base+path, nil)
	if err != nil {
		return zero, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	res, err := client.Do(req)
	if err != nil {
		return zero, err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	if err != nil {
		return zero, err
	}
	var body envelope[T]
	if err := json.Unmarshal(raw, &body); err != nil {
		return zero, err
	}
	if body.Status != "ok" {
		if body.Error != nil {
			return zero, fmt.Errorf("%s: %s", body.Error.Code, body.Error.Message)
		}
		return zero, fmt.Errorf("unexpected response (HTTP %d)", res.StatusCode)
	}
	return body.Data, nil
}

func main() {
	key := os.Getenv("BOLAGSKVARNEN_KEY")
	if key == "" {
		fmt.Fprintln(os.Stderr, "Set BOLAGSKVARNEN_KEY to a test key (gb_test_...).")
		os.Exit(1)
	}
	base := os.Getenv("BOLAGSKVARNEN_URL")
	if base == "" {
		base = "https://app.bolagskvarnen.se/api/v1"
	}
	query := "Exempelbolaget"
	if len(os.Args) > 1 {
		query = os.Args[1]
	}

	// Search by name (at least four characters).
	hits, err := get[[]hit](base, key, "/companies/search?q="+url.QueryEscape(query)+"&limit=5")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if len(hits) == 0 {
		fmt.Println("No match.")
		return
	}
	for _, h := range hits {
		fmt.Printf("%s  %s\n", h.OrgNumber, h.Name)
	}

	// Board and signatory rights for the first hit.
	orgNumber := hits[0].OrgNumber
	r, err := get[roles](base, key, "/companies/"+orgNumber+"/roles")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("Board and other roles for %s:\n", orgNumber)
	for _, ro := range r.Roles {
		fmt.Printf("  %s: %s (from %s)\n", ro.Role, ro.Name, ro.FromDate)
	}
	for _, text := range r.SignatoryRights {
		fmt.Printf("  Signatory rights: %s\n", text)
	}
}
