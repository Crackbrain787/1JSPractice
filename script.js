document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const autocompleteResults = document.getElementById('autocomplete-results');
    const repositoriesContainer = document.getElementById('repositories-container');

    let debounceTimer;
    const debounceDelay = 300;

    loadSavedRepositories();

    // Обработчик ввода как в задачке debounce
    searchInput.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (!query) {
            autocompleteResults.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(() => searchRepositories(query), debounceDelay);
    });

    // Запрос на Гит
    async function searchRepositories(query) {
        try {
            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Ошибка GitHub API: ${response.status}`);
            }

            const data = await response.json();
            displayAutocompleteResults(data.items);
        } catch (error) {
            console.error('Ошибка запроса:', error);
            showAutocompleteMessage('Произошла ошибка при получении данных.');
        }
    }

    // Показ автокомплита
    function displayAutocompleteResults(repositories) {
        autocompleteResults.innerHTML = '';

        if (!repositories || repositories.length === 0) {
            showAutocompleteMessage('Ничего не найдено');
            return;
        }

        repositories.forEach(repo => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = repo.full_name;

            item.addEventListener('click', () => {
                addRepository(repo);
                searchInput.value = '';
                autocompleteResults.style.display = 'none';
            });

            autocompleteResults.appendChild(item);
        });

        autocompleteResults.style.display = 'block';
    }

    // Сообщение в автокомплите
    function showAutocompleteMessage(message) {
        autocompleteResults.innerHTML = `<div class="autocomplete-item" style="color:#666;">${message}</div>`;
        autocompleteResults.style.display = 'block';
    }

    // Добавление репозитория в список
    function addRepository(repo) {
        const existingRepos = JSON.parse(localStorage.getItem('savedRepositories')) || [];

        if (existingRepos.some(r => r.id === repo.id)) {
            alert('Этот репозиторий уже есть в списке!');
            return;
        }

        const repositoryData = {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            owner: repo.owner.login,
            stars: repo.stargazers_count
        };

        existingRepos.push(repositoryData);
        localStorage.setItem('savedRepositories', JSON.stringify(existingRepos));

        renderRepository(repositoryData);
    }

    // Для одного
    function renderRepository(repo) {
        const repoCard = document.createElement('div');
        repoCard.className = 'repository-card';
        repoCard.innerHTML = `
            <div class="repository-info">
                <div class="repository-name">${repo.name}</div>
                <div class="repository-owner">Owner: ${repo.owner}</div>
                <div class="repository-stars">Stars: ${repo.stars}</div>
            </div>
            <button class="delete-btn" data-id="${repo.id}">Удалить</button>
        `;

        repoCard.querySelector('.delete-btn').addEventListener('click', () => deleteRepository(repo.id));
        repositoriesContainer.appendChild(repoCard);

        const noReposMessage = document.querySelector('.no-repositories');
        if (noReposMessage) noReposMessage.remove();
    }

    // Удаление репозитория
    function deleteRepository(repoId) {
        let savedRepos = JSON.parse(localStorage.getItem('savedRepositories')) || [];
        savedRepos = savedRepos.filter(repo => repo.id !== repoId);
        localStorage.setItem('savedRepositories', JSON.stringify(savedRepos));

        const repoElement = document.querySelector(`.delete-btn[data-id="${repoId}"]`)?.parentElement;
        if (repoElement) repoElement.remove();

        if (savedRepos.length === 0) {
            showNoRepositoriesMessage();
        }
    }

    // Загрузка репозиториев из localStorage
    function loadSavedRepositories() {
        const savedRepos = JSON.parse(localStorage.getItem('savedRepositories')) || [];
        if (savedRepos.length === 0) {
            showNoRepositoriesMessage();
            return;
        }
        savedRepos.forEach(repo => renderRepository(repo));
    }

    // Сообщение, что список пуст
    function showNoRepositoriesMessage() {
        repositoriesContainer.innerHTML = '<div class="no-repositories">Список репозиториев пуст. Найдите и добавьте!</div>';
    }

    // Закрытие автокомплита при клике вне
    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !autocompleteResults.contains(e.target)) {
            autocompleteResults.style.display = 'none';
        }
    });
});