const normalizeDomain = (url) => {
	const domain = new URL(url).hostname;
	return domain.startsWith("www.") ? domain.slice(4) : domain; // Remove "www." if present
};

const combineCases = (cases) => {
  const domainMap = {};
  const passwordMap = {};

  // Helper to normalize domain

  // Step 1: Group objects by normalized domain and collect all logins and passwords
  cases.forEach(({ url, logins, password }) => {
    const domain = normalizeDomain(url);

    // Initialize domain in both maps if not present
    if (!domainMap[domain]) domainMap[domain] = new Set();
    if (!passwordMap[domain]) passwordMap[domain] = new Set();

    // Add all logins to the domain group
    logins.forEach(({ text, from }) => {
      domainMap[domain].add(JSON.stringify({ text, from })); // Serialize for uniqueness
    });

    // Add passwords to the password group
    passwordMap[domain].add(password);
  });

  // Step 2: Convert domain logins and passwords back to array format
  Object.keys(domainMap).forEach((domain) => {
    domainMap[domain] = Array.from(domainMap[domain]).map((login) =>
      JSON.parse(login)
    );
    passwordMap[domain] = Array.from(passwordMap[domain]); // Convert Set to array
  });

	let results = [];

	cases.forEach(({ url, logins, password }) => {
    const domain = normalizeDomain(url);
		let passwords = passwordMap[domain];
		passwords.forEach(password => {
			results.push({url, logins: domainMap[domain], password})
		})
  });

	return results
};

module.exports = combineCases;