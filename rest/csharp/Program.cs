// Search for a company and fetch its board from the Bolagskvarnen sandbox.
//
// Usage (.NET 8 or later):
//     export BOLAGSKVARNEN_KEY=gb_test_...
//     dotnet run -- Exempelbolaget
//
// Needs a test key (fictional companies). Live data is not open yet.

using System.Net.Http.Headers;
using System.Text.Json;

var key = Environment.GetEnvironmentVariable("BOLAGSKVARNEN_KEY");
if (string.IsNullOrEmpty(key))
{
    Console.Error.WriteLine("Set BOLAGSKVARNEN_KEY to a test key (gb_test_...).");
    return 1;
}
var baseUrl = Environment.GetEnvironmentVariable("BOLAGSKVARNEN_URL") ?? "https://app.bolagskvarnen.se/api/v1";
var query = args.Length > 0 ? args[0] : "Exempelbolaget";

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);

async Task<JsonElement> Get(string path)
{
    using var res = await http.GetAsync(baseUrl + path);
    var body = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
    if (body.GetProperty("status").GetString() != "ok")
    {
        var error = body.GetProperty("error");
        throw new Exception($"{error.GetProperty("code").GetString()}: {error.GetProperty("message").GetString()}");
    }
    return body;
}

// Search by name (at least four characters).
var search = await Get($"/companies/search?q={Uri.EscapeDataString(query)}&limit=5");
var hits = search.GetProperty("data").EnumerateArray().ToList();
if (hits.Count == 0)
{
    Console.WriteLine("No match.");
    return 0;
}
foreach (var hit in hits)
{
    Console.WriteLine($"{hit.GetProperty("org_number").GetString()}  {hit.GetProperty("name").GetString()}");
}

// Board and signatory rights for the first hit.
var orgNumber = hits[0].GetProperty("org_number").GetString();
var roles = (await Get($"/companies/{orgNumber}/roles")).GetProperty("data");
Console.WriteLine($"Board and other roles for {orgNumber}:");
foreach (var role in roles.GetProperty("roles").EnumerateArray())
{
    Console.WriteLine($"  {role.GetProperty("role").GetString()}: {role.GetProperty("name").GetString()} (from {role.GetProperty("from_date").GetString()})");
}
foreach (var text in roles.GetProperty("signatory_rights").EnumerateArray())
{
    Console.WriteLine($"  Signatory rights: {text.GetString()}");
}
return 0;
