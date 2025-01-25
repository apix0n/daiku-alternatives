async function searchAniList(queryArg) {
    var query = `
query Media($search: String, $mediaId: Int) {
  Page(perPage: 15) {
    media(search: $search, id: $mediaId, sort: SEARCH_MATCH) {
      title {
        english
        romaji
      }
      type
      format
      startDate {
        year
      }
      coverImage {
        medium
        large
        color
      }
      id
      status
      nextAiringEpisode {
        episode
      }
    }
  }
}`;

    var variables = {
        mediaId: queryArg.includes("alid:") ? queryArg.replace("alid:", "") : undefined,
        search: !queryArg.includes("alid:") ? queryArg : undefined,
    };

    var url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    var response = await fetch(url, options)
    if (!response.ok) throw new Error("HTTP error " + response.status);
    return await response.json()
}

function createMediaElements(mediaList) {
    var container = document.getElementById('results');
    container.innerHTML = ''; // Clear previous results
    console.log(mediaList)

    mediaList.data.Page.media.forEach(media => {
        var titlesHtml = ``
        if (media.title.english) {
            titlesHtml += `<span data-lang="english">${media.title.english}</span>`;
        }
        titlesHtml += `<span data-lang="romaji">${media.title.romaji}</span>`;

        var mediaElement = document.createElement('a');
        mediaElement.className = 'search-result';
        mediaElement.setAttribute('data-type', media.type);
        mediaElement.setAttribute('href', `add/?id=${media.id}`);
        mediaElement.innerHTML = `
    <div class="image" style="background-image: url(${media.coverImage.medium})"></div>
    <div class="titles" data-status="${media.status}">
        ${titlesHtml}
    </div>
    <div class="informations">
        <span>${media.type.toLowerCase()} · ${media.startDate.year ? media.startDate.year : ''} ${media.format !== "MANGA" ? media.format.replace("_", " ") : ''}</span>
        <span class="id">${media.id}</span>
    </div>
`;
        container.appendChild(mediaElement);
    });
}

function getQueryVariable(variable) { // https://stackoverflow.com/a/827378
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    alert('Query Variable ' + variable + ' not found');
}