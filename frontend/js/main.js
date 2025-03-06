import { loadUserFromLocalStorage, setupLogin, setupLogout } from './auth.js';
import { setupModalEvents } from './modals.js';

import { setupProductForm, setupEditForm } from './products.js';
import { setupFinanceForm } from './finances.js';

// Inicialização
loadUserFromLocalStorage();
setupLogin();
setupLogout();
setupModalEvents();

// Estoque produtos
setupProductForm();
setupEditForm();


// Finanças
setupFinanceForm();
