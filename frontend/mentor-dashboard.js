// Mentor Dashboard JavaScript
class MentorDashboard {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.currentProject = null;
        this.init();
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '../registration/registration.html';
            return;
        }

        // Get current user info
        try {
            const response = await fetch('http://localhost:3000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user profile');
            }

            this.currentUser = await response.json();
            
            // Check if user is a mentor
            if (this.currentUser.role !== 'mentor') {
                alert('Access denied. This page is only available to mentors.');
                window.location.href = '../home/home.html';
                return;
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            window.location.href = '../registration/registration.html';
            return;
        }

        this.setupEventListeners();
        this.loadProjects();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                window.location.href = '../registration/registration.html';
            });
        }

        // Create project form
        document.getElementById('create-project-form').addEventListener('submit', (e) => {
            this.handleCreateProject(e);
        });

        // Modal controls
        this.setupModals();
    }

    setupModals() {
        // Project modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal('project-modal');
        });

        // Module modal
        document.getElementById('close-module-modal').addEventListener('click', () => {
            this.closeModal('module-modal');
        });

        document.getElementById('cancel-module').addEventListener('click', () => {
            this.closeModal('module-modal');
        });

        document.getElementById('module-form').addEventListener('submit', (e) => {
            this.handleModuleSubmit(e);
        });

        // Resource modal
        document.getElementById('close-resource-modal').addEventListener('click', () => {
            this.closeModal('resource-modal');
        });

        document.getElementById('cancel-resource').addEventListener('click', () => {
            this.closeModal('resource-modal');
        });

        document.getElementById('resource-form').addEventListener('submit', (e) => {
            this.handleResourceSubmit(e);
        });

        // Modal tabs
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchModalTab(e.target.dataset.modalTab);
            });
        });

        // Add module/resource buttons
        document.getElementById('add-module-btn').addEventListener('click', () => {
            this.showModuleForm();
        });

        document.getElementById('add-resource-btn').addEventListener('click', () => {
            this.showResourceForm();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data if needed
        if (tabName === 'projects') {
            this.loadProjects();
        }
    }

    switchModalTab(tabName) {
        // Update modal tab buttons
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-modal-tab="${tabName}"]`).classList.add('active');

        // Update modal tab content
        document.querySelectorAll('.modal-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-modal-tab`).classList.add('active');

        // Load data based on tab
        if (this.currentProject) {
            if (tabName === 'modules') {
                this.loadProjectModules(this.currentProject.id);
            } else if (tabName === 'resources') {
                this.loadProjectResources(this.currentProject.id);
            } else if (tabName === 'analytics') {
                this.loadProjectAnalytics(this.currentProject.id);
            }
        }
    }

    async loadProjects() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3000/api/mentor/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load projects');
            }

            this.projects = await response.json();
            this.displayProjects();
            this.updateProjectStats();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showError('Failed to load projects');
        }
    }

    displayProjects() {
        const projectsList = document.getElementById('projects-list');
        
        if (this.projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h4>No Projects Created Yet</h4>
                    <p>Create your first project to start building learning experiences!</p>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = this.projects.map(project => `
            <div class="project-card" onclick="mentorDashboard.openProjectModal(${project.id})">
                <h4>${this.escapeHtml(project.name)}</h4>
                <p>${this.escapeHtml(project.description)}</p>
                <div class="project-meta">
                    <span class="difficulty-badge ${project.difficulty.toLowerCase()}">
                        ${project.difficulty}
                    </span>
                    <span>Created: ${new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div class="project-stats">
                    <span><i class="fas fa-users"></i> ${project.enrolled_count || 0} enrolled</span>
                    <span><i class="fas fa-puzzle-piece"></i> ${project.modules_count || 0} modules</span>
                </div>
            </div>
        `).join('');
    }

    updateProjectStats() {
        const totalProjects = this.projects.length;
        const totalEnrolled = this.projects.reduce((sum, project) => 
            sum + (project.enrolled_count || 0), 0);

        document.getElementById('total-projects').textContent = totalProjects;
        document.getElementById('total-enrolled').textContent = totalEnrolled;
    }

    async handleCreateProject(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const projectData = Object.fromEntries(formData.entries());

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3000/api/mentor/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                throw new Error('Failed to create project');
            }

            const newProject = await response.json();
            this.showSuccess('Project created successfully!');
            e.target.reset();
            this.switchTab('projects');
            this.loadProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            this.showError('Failed to create project');
        }
    }

    async openProjectModal(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        if (!this.currentProject) return;

        document.getElementById('modal-project-title').textContent = this.currentProject.name;
        document.getElementById('project-modal').style.display = 'block';
        
        // Reset to first tab
        this.switchModalTab('modules');
    }

    async loadProjectModules(projectId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/projects/${projectId}/modules`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load modules');
            }

            const modules = await response.json();
            this.displayModules(modules);
        } catch (error) {
            console.error('Error loading modules:', error);
            this.showError('Failed to load modules');
        }
    }

    displayModules(modules) {
        const modulesList = document.getElementById('modules-list');
        
        if (modules.length === 0) {
            modulesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-puzzle-piece"></i>
                    <h4>No Modules Created</h4>
                    <p>Add learning modules to structure your project content.</p>
                </div>
            `;
            return;
        }

        modulesList.innerHTML = modules.map(module => `
            <div class="module-item">
                <h5>${this.escapeHtml(module.title)}</h5>
                <p>${this.escapeHtml(module.description)}</p>
                <div class="item-meta">
                    <span>Order: ${module.order_sequence} | Resources: ${module.resource_count || 0}</span>
                    <div class="item-actions">
                        <button class="btn-edit" onclick="mentorDashboard.editModule(${module.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="mentorDashboard.deleteModule(${module.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadProjectResources(projectId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/projects/${projectId}/resources`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load resources');
            }

            const resources = await response.json();
            this.displayResources(resources);
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError('Failed to load resources');
        }
    }

    displayResources(resources) {
        const resourcesList = document.getElementById('resources-list');
        
        if (resources.length === 0) {
            resourcesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h4>No Resources Added</h4>
                    <p>Add learning resources to support your project modules.</p>
                </div>
            `;
            return;
        }

        resourcesList.innerHTML = resources.map(resource => `
            <div class="resource-item">
                <h5>
                    <i class="fas fa-${this.getResourceIcon(resource.resource_type)}"></i>
                    ${this.escapeHtml(resource.title)}
                </h5>
                <p>${this.escapeHtml(resource.description || '')}</p>
                <div class="item-meta">
                    <span>
                        ${resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                        ${resource.estimated_duration ? ` | ${resource.estimated_duration} min` : ''}
                    </span>
                    <div class="item-actions">
                        <button class="btn-edit" onclick="mentorDashboard.editResource(${resource.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="mentorDashboard.deleteResource(${resource.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadProjectAnalytics(projectId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/projects/${projectId}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load analytics');
            }

            const analytics = await response.json();
            this.displayAnalytics(analytics);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics');
        }
    }

    displayAnalytics(analytics) {
        document.getElementById('project-enrollments').textContent = analytics.enrollments || 0;
        document.getElementById('completion-rate').textContent = 
            analytics.completion_rate ? `${analytics.completion_rate}%` : '0%';
    }

    showModuleForm(module = null) {
        const form = document.getElementById('module-form');
        const title = document.getElementById('module-modal-title');
        
        if (module) {
            title.textContent = 'Edit Module';
            form.elements.id.value = module.id;
            form.elements.title.value = module.title;
            form.elements.description.value = module.description;
            form.elements.order_index.value = module.order_sequence;
            form.elements.xp_reward.value = module.xp_reward || 0;
        } else {
            title.textContent = 'Add Module';
            form.reset();
        }
        
        form.elements.project_id.value = this.currentProject.id;
        document.getElementById('module-modal').style.display = 'block';
    }

    showResourceForm(resource = null) {
        const form = document.getElementById('resource-form');
        const title = document.getElementById('resource-modal-title');
        
        if (resource) {
            title.textContent = 'Edit Resource';
            form.elements.id.value = resource.id;
            form.elements.title.value = resource.title;
            form.elements.type.value = resource.resource_type;
            form.elements.url.value = resource.url;
            form.elements.description.value = resource.description || '';
            form.elements.duration.value = resource.estimated_duration || '';
        } else {
            title.textContent = 'Add Resource';
            form.reset();
        }
        
        form.elements.project_id.value = this.currentProject.id;
        document.getElementById('resource-modal').style.display = 'block';
    }

    async handleModuleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const moduleData = Object.fromEntries(formData.entries());
        const isEdit = moduleData.id;

        try {
            const token = localStorage.getItem('authToken');
            const url = isEdit 
                ? `http://localhost:3000/api/mentor/modules/${moduleData.id}`
                : 'http://localhost:3000/api/mentor/modules';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(moduleData)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEdit ? 'update' : 'create'} module`);
            }

            this.showSuccess(`Module ${isEdit ? 'updated' : 'created'} successfully!`);
            this.closeModal('module-modal');
            this.loadProjectModules(this.currentProject.id);
        } catch (error) {
            console.error('Error saving module:', error);
            this.showError(`Failed to ${isEdit ? 'update' : 'create'} module`);
        }
    }

    async handleResourceSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const resourceData = Object.fromEntries(formData.entries());
        const isEdit = resourceData.id;

        try {
            const token = localStorage.getItem('authToken');
            const url = isEdit 
                ? `http://localhost:3000/api/mentor/resources/${resourceData.id}`
                : 'http://localhost:3000/api/mentor/resources';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resourceData)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEdit ? 'update' : 'create'} resource`);
            }

            this.showSuccess(`Resource ${isEdit ? 'updated' : 'created'} successfully!`);
            this.closeModal('resource-modal');
            this.loadProjectResources(this.currentProject.id);
        } catch (error) {
            console.error('Error saving resource:', error);
            this.showError(`Failed to ${isEdit ? 'update' : 'create'} resource`);
        }
    }

    async editModule(moduleId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/projects/${this.currentProject.id}/modules`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get module details');
            }

            const modules = await response.json();
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                this.showModuleForm(module);
            }
        } catch (error) {
            console.error('Error loading module:', error);
            this.showError('Failed to load module details');
        }
    }

    async editResource(resourceId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/projects/${this.currentProject.id}/resources`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get resource details');
            }

            const resources = await response.json();
            const resource = resources.find(r => r.id === resourceId);
            if (resource) {
                this.showResourceForm(resource);
            }
        } catch (error) {
            console.error('Error loading resource:', error);
            this.showError('Failed to load resource details');
        }
    }

    async deleteModule(moduleId) {
        if (!confirm('Are you sure you want to delete this module?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/modules/${moduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete module');
            }

            this.showSuccess('Module deleted successfully!');
            this.loadProjectModules(this.currentProject.id);
        } catch (error) {
            console.error('Error deleting module:', error);
            this.showError('Failed to delete module');
        }
    }

    async deleteResource(resourceId) {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:3000/api/mentor/resources/${resourceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete resource');
            }

            this.showSuccess('Resource deleted successfully!');
            this.loadProjectResources(this.currentProject.id);
        } catch (error) {
            console.error('Error deleting resource:', error);
            this.showError('Failed to delete resource');
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    getResourceIcon(type) {
        const icons = {
            video: 'play-circle',
            article: 'file-alt',
            course: 'graduation-cap',
            quiz: 'question-circle',
            tool: 'tools',
            book: 'book'
        };
        return icons[type] || 'file';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(message);
    }

    showError(message) {
        // Simple alert for now - could be replaced with a toast notification
        alert(`Error: ${message}`);
    }
}

// Initialize the mentor dashboard
const mentorDashboard = new MentorDashboard();
