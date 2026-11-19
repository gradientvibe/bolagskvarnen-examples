<?php
// Search for a company and fetch its board from the Bolagskvarnen sandbox.
//
// Usage (PHP 8 with the curl extension):
//     export BOLAGSKVARNEN_KEY=gb_test_...
//     php lookup.php Exempelbolaget
//
// Needs a test key (fictional companies). Live data is not open yet.

$key = getenv('BOLAGSKVARNEN_KEY');
if ($key === false || $key === '') {
    fwrite(STDERR, "Set BOLAGSKVARNEN_KEY to a test key (gb_test_...).\n");
    exit(1);
}
$base = getenv('BOLAGSKVARNEN_URL') ?: 'https://app.bolagskvarnen.se/api/v1';
$query = $argv[1] ?? 'Exempelbolaget';

function get(string $base, string $key, string $path): array
{
    $ch = curl_init($base . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $key"],
    ]);
    $raw = curl_exec($ch);
    if ($raw === false) {
        throw new RuntimeException(curl_error($ch));
    }
    $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if ($body['status'] !== 'ok') {
        throw new RuntimeException($body['error']['code'] . ': ' . $body['error']['message']);
    }
    return $body;
}

// Search by name (at least four characters).
$hits = get($base, $key, '/companies/search?q=' . rawurlencode($query) . '&limit=5')['data'];
if (count($hits) === 0) {
    echo "No match.\n";
    exit(0);
}
foreach ($hits as $hit) {
    echo "{$hit['org_number']}  {$hit['name']}\n";
}

// Board and signatory rights for the first hit.
$orgNumber = $hits[0]['org_number'];
$roles = get($base, $key, "/companies/$orgNumber/roles")['data'];
echo "Board and other roles for $orgNumber:\n";
foreach ($roles['roles'] as $role) {
    echo "  {$role['role']}: {$role['name']} (from {$role['from_date']})\n";
}
foreach ($roles['signatory_rights'] as $text) {
    echo "  Signatory rights: $text\n";
}
