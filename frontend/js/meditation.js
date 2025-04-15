async function fetchVerses(texto, versesDiv) {
    versesDiv.className = 'verses loading';
    try {
        const response = await fetch(`https://bible-api.com/${texto}?translation=almeida`);
        const data = await response.json();
        const referencia = `${data.reference}`;
        const textoFormatado = data.text.replace(/\n/g, '<br>');

        versesDiv.innerHTML = `
            <strong>Versículos:</strong> ${referencia}<br><br>
            <strong>Texto:</strong><br>${textoFormatado}
        `;
    } catch (error) {
        versesDiv.textContent = `Erro ao carregar versículos: ${texto}`;
    } finally {
        versesDiv.classList.remove('loading');
    }
}

async function loadMeditationPlan() {
    try {
        const response = await fetch('../utils/meditation-day.json');
        const data = await response.json();
        const container = document.getElementById('meditation-plan');
        const today = new Date();
        const currentMonth = today.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();
        const currentDay = today.getDate();
        let dayCounter = 0;

        Object.keys(data).forEach((month) => {
            const monthData = data[month];

            monthData.forEach((item) => {
                const isToday = month.toLowerCase() === currentMonth && item.dia === currentDay;
                const accordionItem = document.createElement('div');
                accordionItem.className = `accordion-item ${isToday ? 'current' : ''}`;

                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.textContent = `Dia ${dayCounter + 1} (${item.dia} de ${month})`;
                accordionItem.appendChild(header);

                const content = document.createElement('div');
                content.className = `accordion-content ${isToday ? 'active' : ''}`;

                // Inner accordion for chapters
                const chaptersAccordion = document.createElement('div');
                chaptersAccordion.className = 'chapters-accordion';

                item.leitura.forEach((chapter, chapterIndex) => {
                    const chapterItem = document.createElement('div');
                    chapterItem.className = 'chapter-item';

                    const chapterHeader = document.createElement('div');
                    chapterHeader.className = 'chapter-header';
                    chapterHeader.textContent = chapter.replace('+', ' ');
                    chapterItem.appendChild(chapterHeader);

                    const chapterContent = document.createElement('div');
                    chapterContent.className = 'chapter-content';
                    chapterContent.style.display = 'none'; // Initially hidden

                    const versesDiv = document.createElement('div');
                    versesDiv.className = 'verses';
                    versesDiv.textContent = `Clique para carregar: ${chapter.replace('+', ' ')}`;
                    chapterContent.appendChild(versesDiv);

                    chapterItem.appendChild(chapterContent);
                    chaptersAccordion.appendChild(chapterItem);

                    chapterHeader.addEventListener('click', async (event) => {
                        event.stopPropagation(); // Prevent outer accordion from interfering
                        const isActive = chapterContent.style.display === 'block';
                        // Close other chapter contents
                        chaptersAccordion
                            .querySelectorAll('.chapter-content')
                            .forEach((c) => (c.style.display = 'none'));
                        if (!isActive) {
                            chapterContent.style.display = 'block';
                            if (versesDiv.textContent.startsWith('Clique para carregar:')) {
                                await fetchVerses(chapter.replace('+', ''), versesDiv);
                            }
                        }
                    });

                    // Auto-open first chapter for today
                    if (isToday && chapterIndex === 0) {
                        chapterContent.style.display = 'block';
                        fetchVerses(chapter.replace('+', ''), versesDiv);
                    }
                });

                content.appendChild(chaptersAccordion);

                // Meditation fields
                const fields = [
                    { id: 'versiculo_chave', label: 'Versículo Chave', type: 'input' },
                    { id: 'promessa', label: 'Promessa', type: 'textarea' },
                    { id: 'condicao', label: 'Condição', type: 'textarea' },
                    { id: 'aplicacao', label: 'Aplicação na Prática', type: 'textarea' },
                    { id: 'oracao', label: 'Oração', type: 'textarea' }
                ];

                fields.forEach((field) => {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    label.htmlFor = `${field.id}_${month}_${item.dia}`;
                    content.appendChild(label);

                    const element = document.createElement(field.type === 'input' ? 'input' : 'textarea');
                    element.id = `${field.id}_${month}_${item.dia}`;
                    element.name = field.id;

                    const savedData = localStorage.getItem(`meditation_${month}_${item.dia}`);
                    if (savedData) {
                        const parsed = JSON.parse(savedData);
                        element.value = parsed[field.id] || '';
                    }

                    content.appendChild(element);
                });

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Salvar Meditação';
                saveButton.addEventListener('click', () => {
                    const meditationData = {
                        versiculo_chave: document.getElementById(`versiculo_chave_${month}_${item.dia}`).value,
                        promessa: document.getElementById(`promessa_${month}_${item.dia}`).value,
                        condicao: document.getElementById(`condicao_${month}_${item.dia}`).value,
                        aplicacao: document.getElementById(`aplicacao_${month}_${item.dia}`).value,
                        oracao: document.getElementById(`oracao_${month}_${item.dia}`).value
                    };
                    localStorage.setItem(`meditation_${month}_${item.dia}`, JSON.stringify(meditationData));
                    alert('Meditação salva com sucesso!');
                });
                content.appendChild(saveButton);

                accordionItem.appendChild(content);
                container.appendChild(accordionItem);

                header.addEventListener('click', () => {
                    const isActive = content.classList.contains('active');
                    document.querySelectorAll('.accordion-content').forEach((c) => c.classList.remove('active'));
                    if (!isActive) {
                        content.classList.add('active');
                    }
                });

                dayCounter++;
            });
        });
    } catch (error) {
        console.error('Erro ao carregar o plano:', error);
        document.getElementById('meditation-plan').innerHTML = '<p>Erro ao carregar o plano de meditação.</p>';
    }
}

window.onload = loadMeditationPlan;