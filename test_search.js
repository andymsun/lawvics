
async function testSearch() {
    const response = await fetch('http://localhost:3000/api/statute/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-data-source': 'mock'
        },
        body: JSON.stringify({
            stateCode: 'CA',
            query: 'statute of limitations for fraud'
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

testSearch();
