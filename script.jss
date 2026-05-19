// Usamos una nueva Key limpia para evitar conflictos con versiones previas tuyas en local
const STORAGE_KEY = 'conectado_db_v1';
let posts = [];
let currentFilter = 'Todos';
let searchQuery = '';

const qaForm = document.getElementById('qa-form');
const postsContainer = document.getElementById('posts-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const spinner = submitBtn.querySelector('.spinner');

const roleChips = document.querySelectorAll('.role-chip-btn');
const hiddenRoleInput = document.getElementById('author-role');

function init() {
    // Sistema robusto de persistencia (Carga)
    try {
        const storedPosts = localStorage.getItem(STORAGE_KEY);
        if (storedPosts) {
            posts = JSON.parse(storedPosts);
        }
    } catch (error) {
        console.error("Error al leer datos guardados, iniciando base de datos vacía:", error);
        posts = [];
    }
    
    renderPosts();
    setupEventListeners();
    setupRoleSelector();
}

function saveToStorage() {
    // Sistema robusto de persistencia (Guardado Seguro)
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
        console.error("No se pudo guardar la publicación localmente:", error);
    }
}

function setupEventListeners() {
    qaForm.addEventListener('submit', handleCreatePost);

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderPosts();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderPosts();
        });
    });
}

function setupRoleSelector() {
    roleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Limpia los demás botones
            roleChips.forEach(c => c.classList.remove('active'));
            
            // Activa el clickeado (CSS mostrará el Check y el borde azul)
            chip.classList.add('active');
            
            // Asigna el valor para publicarlo
            hiddenRoleInput.value = chip.getAttribute('data-role');
        });
    });
}

function handleCreatePost(e) {
    e.preventDefault();

    if (!hiddenRoleInput.value) {
        alert('Por favor, selecciona tu Rol haciendo clic en "Docente", "Apoderado" o "Funcionario".');
        return;
    }

    submitBtn.disabled = true;
    btnText.textContent = 'Procesando e indexando...';
    spinner.classList.remove('hidden');

    const nameInput = document.getElementById('author-name').value.trim();
    const roleValue = hiddenRoleInput.value;
    const categoryInput = document.getElementById('category').value;
    const titleInput = document.getElementById('title').value.trim();
    const messageInput = document.getElementById('message').value.trim();

    setTimeout(() => {
        const newPost = {
            id: 'post_' + Date.now(),
            authorName: nameInput,
            authorRole: roleValue,
            category: categoryInput,
            title: titleInput,
            message: messageInput,
            date: new Date().toLocaleString('es-CL', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            }),
            replies: []
        };

        // Guardado garantizado
        posts.unshift(newPost);
        saveToStorage(); 
        
        renderPosts(newPost.id); 
        
        // Limpiamos el formulario para el siguiente mensaje
        qaForm.reset();
        roleChips.forEach(c => c.classList.remove('active'));
        hiddenRoleInput.value = '';

        submitBtn.disabled = false;
        btnText.textContent = 'Publicar en la Línea de Tiempo';
        spinner.classList.add('hidden');
    }, 600);
}

function handleCreateReply(e, postId) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('.reply-name').value.trim();
    const role = form.querySelector('.reply-role').value.trim();
    const body = form.querySelector('.reply-body-input').value.trim();

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        const newReply = {
            id: 'reply_' + Date.now(),
            authorName: name,
            authorRole: role,
            message: body,
            date: new Date().toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        posts[postIndex].replies.push(newReply);
        saveToStorage(); // Guardamos el comentario permanentemente
        renderPosts();
    }
}

function renderPosts(newPostId = null) {
    postsContainer.innerHTML = '';

    const filteredPosts = posts.filter(post => {
        const matchesFilter = (currentFilter === 'Todos' || post.category === currentFilter);
        const matchesSearch = (
            post.title.toLowerCase().includes(searchQuery) ||
            post.message.toLowerCase().includes(searchQuery) ||
            post.authorName.toLowerCase().includes(searchQuery) ||
            post.authorRole.toLowerCase().includes(searchQuery)
        );
        return matchesFilter && matchesSearch;
    });

    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state transition-card">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" style="margin: 0 auto;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <h3>Línea de tiempo vacía</h3>
                <p>No se encontraron registros activos bajo los filtros aplicados.</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        const isNew = post.id === newPostId;
        const badgeClass = post.category === 'Comunicado' ? 'comunicado' : 'consulta';
        const card = document.createElement('article');
        card.className = `post-card ${isNew ? 'new-post-anim' : 'transition-card'}`;

        let repliesHTML = '';
        if (post.replies && post.replies.length > 0) {
            repliesHTML = post.replies.map(reply => `
                <div class="reply-item">
                    <div class="reply-meta">
                        <div>
                            <span class="reply-user">${escapeHTML(reply.authorName)}</span>
                            <span class="reply-role">• ${escapeHTML(reply.authorRole)}</span>
                        </div>
                        <span class="reply-date">${reply.date}</span>
                    </div>
                    <p class="reply-body">${escapeHTML(reply.message)}</p>
                </div>
            `).join('');
        }

        card.innerHTML = `
            <div class="post-header">
                <div class="meta-user">
                    <span class="post-author">${escapeHTML(post.authorName)}</span>
                    <span class="post-role">${escapeHTML(post.authorRole)}</span>
                    <span class="post-date">${post.date}</span>
                </div>
                <span class="badge ${badgeClass}">${post.category}</span>
            </div>
            <h3 class="post-title">${escapeHTML(post.title)}</h3>
            <p class="post-body">${escapeHTML(post.message)}</p>

            <div class="replies-container">
                ${post.replies.length > 0 ? `<h4 class="replies-title">Respuestas de la comunidad (${post.replies.length})</h4>` : ''}
                <div class="replies-list">${repliesHTML}</div>
                
                <form class="reply-form" data-postid="${post.id}">
                    <div class="reply-mini-grid">
                        <input type="text" placeholder="Tu nombre" class="input-reply-small reply-name" required>
                        <input type="text" placeholder="Tu rol (ej. Apoderado)" class="input-reply-small reply-role" required>
                    </div>
                    <input type="text" placeholder="Escribe un comentario oficial..." class="input-reply-small reply-body-input" required>
                    <button type="submit" class="btn-reply">Responder</button>
                </form>
            </div>
        `;

        const replyForm = card.querySelector('.reply-form');
        replyForm.addEventListener('submit', (e) => handleCreateReply(e, post.id));

        postsContainer.appendChild(card);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', init);
