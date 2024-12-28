function getTournaments() {
    const search = document.getElementById("search").value;
    fetch("/tournaments/" + search)
        .then(results => results.json())
        .then(results => {
            document.getElementById("results").innerHTML = "";
            results.forEach(result => {
                const item = document.createElement("li");
                item.innerHTML = result.name + " (" + result.entries.length + "/" + result.maxPlayers + ") " + new Date(result.startDate).toDateString();
                document.getElementById("results").append(item);
            })
        })
}