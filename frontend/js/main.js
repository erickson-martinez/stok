document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('userName').value;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('loggedUserName').textContent = name;
});

document.getElementById('logoutBtn').addEventListener('click', function () {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
});

document.getElementById('openModalBtn').addEventListener('click', function () {
    document.getElementById('productModal').style.display = 'block';
});

document.getElementById('closeModalBtn').addEventListener('click', function () {
    document.getElementById('productModal').style.display = 'none';
});