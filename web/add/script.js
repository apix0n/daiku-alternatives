function createPreview(mediaData, overrides = {}) {
    var titlesHtml = ``
    if (!overrides["title"]) {
        if (mediaData.title.english) {
            titlesHtml += `<span data-lang="english">${mediaData.title.english}</span>`;
        }
        titlesHtml += `<span data-lang="romaji">${mediaData.title.romaji}</span>`;
    } else {
        titlesHtml += `<span>${overrides["title"]}</span>`;
        if (mediaData.title.english) {
            titlesHtml += `<span><span data-lang="english">${mediaData.title.english}</span> - <span data-lang="romaji">${mediaData.title.romaji}</span></span>`;
        } else {
            titlesHtml += `<span data-lang="romaji">${mediaData.title.romaji}</span>`;
        }
    }

    var mediaElement = document.getElementsByClassName("preview")[0]
    mediaElement.innerHTML = `
    <div class="image" style="background-image: url(${overrides.image && overrides.image["data"] || mediaData.coverImage.large})"></div>
    <div class="titles" data-status="${mediaData.status}">
      ${titlesHtml}
    </div>
    <div class="informations">
      <span>${mediaData.type.toLowerCase()} · ${mediaData.startDate.year ? mediaData.startDate.year : ''} ${mediaData.format !== "MANGA" ? mediaData.format.replace("_", " ") : ''}</span>
      ${overrides["airingEpisodesOffset"] || mediaData.nextAiringEpisode ? `<span class="next-episode">next episode: ${mediaData.nextAiringEpisode.episode + (parseInt(overrides["airingEpisodesOffset"]) || 0)}</span>` : ''}
      ${overrides["accentColor"] || mediaData.coverImage.color ? `<span class="accent-color">accent colour: <div class="accent-color-square" style="--accent: ${overrides["accentColor"] || mediaData.coverImage.color}"></div><code>${overrides["accentColor"] || mediaData.coverImage.color}</code></span>` : ''}
      <span class="id">${mediaData.id}</span>
    </div>
    `;
}

document.addEventListener('DOMContentLoaded', async function () {
    const alInfo = await searchAniList(`alid:${getQueryVariable("id")}`)
    createPreview(alInfo.data.Page.media[0]);

    const colorTextInput = document.getElementById('accent');
    Coloris({
        theme: 'polaroid',
        alpha: false,
        themeMode: "auto",
        onChange: (color) => {
            colorTextInput.value = color;
            updatePreview();
        }
    });

    document.getElementById('removeColorButton').addEventListener('click', () => {
        document.querySelector("input[data-coloris]").value = '';
        colorTextInput.value = '';
        updatePreview();
    });

    document.getElementById('removeTitleButton').addEventListener('click', () => {
        document.getElementById("title").value = '';
        updatePreview();
    });

    document.getElementById("nextEpisodeOffset").addEventListener("keypress", function (e) {
        if (
            e.key.length === 1 && e.key !== '-' && isNaN(e.key) && !e.ctrlKey || e.key === '-' && e.target.value.toString().indexOf('-') > -1
        ) {
            e.preventDefault();
        }
    });

    document.getElementById('removeOffsetButton').addEventListener('click', () => {
        document.getElementById("nextEpisodeOffset").value = '';
        updatePreview();
    });

    let imageData

    document.getElementById('coverUpload').addEventListener('change', () => {
        const file = document.getElementById("coverUpload").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData = e.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('removeCoverButton').addEventListener('click', () => {
        document.getElementById("coverUpload").value = '';
        imageData = undefined;
        updatePreview();
    });

    document.querySelectorAll("input[name='coversrc']").forEach(e => {
        e.addEventListener('change', () => {
            imageData = undefined;
            document.getElementById("coverUpload").value = '';
            updatePreview();
        });
    });

const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('input', () => {
        updatePreview();
    });
});

function updatePreview() {
    const inputValues = {};
    inputValues["title"] = document.getElementById("title").value;
    inputValues["accentColor"] = document.getElementById("accent").value;
    inputValues["airingEpisodesOffset"] = document.getElementById("nextEpisodeOffset").value;
    inputValues["image"] = {};
    inputValues["image"]["data"] = imageData;
    console.log(inputValues)
    createPreview(alInfo.data.Page.media[0], inputValues);
}
});