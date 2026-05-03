// Dark Mode
function initDarkMode() {
    const saved = localStorage.getItem('billSplitterDarkMode');
    if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
    }
    updateToggleIcon();
}
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('billSplitterDarkMode', isDark);
    updateToggleIcon();
}
function updateToggleIcon() {
    const knob = document.getElementById('darkToggleKnob');
    if (knob) {
        knob.textContent = document.body.classList.contains('dark') ? '🌙' : '☀️';
    }
}
initDarkMode();

function moveExtrasForMobile() {
    const extrasBar = document.getElementById('extrasBar');
    const extrasBarMobile = document.getElementById('extrasBarMobile');
    if (window.innerWidth <= 768) {
        if (extrasBar && extrasBarMobile && !extrasBarMobile.hasChildNodes()) {
            extrasBarMobile.appendChild(extrasBar);
            extrasBarMobile.style.display = 'block';
        }
    } else {
        if (extrasBarMobile && extrasBarMobile.hasChildNodes()) {
            document.querySelector('.container').insertBefore(extrasBar, document.getElementById('peopleTab'));
            extrasBarMobile.style.display = 'none';
        }
    }
}
window.addEventListener('resize', moveExtrasForMobile);
window.addEventListener('DOMContentLoaded', moveExtrasForMobile);

let people = [];
let sharedItems = [];
let nextPersonId = 1;
let nextItemId = 1;
let splitMethod = 'proportional';
let currentTab = 'people';

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    const addBtn = document.getElementById('bottomBarAddBtn');
    
    if (tab === 'people') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('peopleTab').classList.add('active');
    } else if (tab === 'shared') {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('sharedTab').classList.add('active');
    } else if (tab === 'summary') {
        document.querySelectorAll('.tab')[2].classList.add('active');
        document.getElementById('summaryTab').classList.add('active');
    }
}

function quickAdd() {
    const fabBtn = document.querySelector('.fab');
    if (fabBtn) {
        fabBtn.classList.add('animate');
        setTimeout(() => fabBtn.classList.remove('animate'), 300);
    }
    
    if (currentTab === 'people') {
        addPerson();
    } else if (currentTab === 'shared') {
        addSharedItem();
    }
}

function setSplitMethod(method) {
    splitMethod = method;
    document.getElementById('proportionalBtn').classList.toggle('active', method === 'proportional');
    document.getElementById('evenBtn').classList.toggle('active', method === 'even');
    updateAllPersonTotals();
    renderSummary();
}

function addPerson() {
    const newId = nextPersonId;
    people.push({
        id: newId,
        name: `Person ${newId}`,
        items: []
    });
    nextPersonId++;
    render();
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            const newPerson = document.querySelector(`[data-person-id="${newId}"]`);
            if (newPerson) {
                newPerson.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const nameInput = newPerson.querySelector('input[type="text"]');
                if (nameInput) {
                    setTimeout(() => nameInput.focus(), 300);
                }
            }
        }, 100);
    }
}

function removePerson(personId) {
    const person = people.find(p => p.id === personId);
    const hasItems = person && person.items.length > 0;
    
    if (hasItems) {
        if (!confirm(`Remove ${person.name || 'this person'} and their items?`)) {
            return;
        }
    }
    
    people = people.filter(p => p.id !== personId);
    sharedItems.forEach(item => {
        item.sharedWith = item.sharedWith.filter(id => id !== personId);
    });
    render();
}

function updatePersonName(personId, name) {
    const person = people.find(p => p.id === personId);
    if (person) {
        person.name = name;
        render();
    }
}

function addItem(personId) {
    const person = people.find(p => p.id === personId);
    if (person) {
        person.items.push({
            id: nextItemId++,
            name: '',
            price: 0
        });
        render();
    }
}

function addSharedItem() {
    const newId = nextItemId++;
    sharedItems.push({
        id: newId,
        name: '',
        price: 0,
        sharedWith: people.map(p => p.id)
    });
    render();
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            const sharedColumns = document.querySelectorAll('.shared-column');
            const newItem = sharedColumns[sharedColumns.length - 1];
            if (newItem) {
                newItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function removeItem(personId, itemId) {
    const person = people.find(p => p.id === personId);
    if (person) {
        person.items = person.items.filter(i => i.id !== itemId);
        render();
    }
}

function removeSharedItem(itemId) {
    sharedItems = sharedItems.filter(i => i.id !== itemId);
    render();
}

function updateItem(personId, itemId, field, value) {
    const person = people.find(p => p.id === personId);
    if (person) {
        const item = person.items.find(i => i.id === itemId);
        if (item) {
            item[field] = field === 'price' ? parseFloat(value) || 0 : value;
            updateAllPersonTotals();
            renderSummary();
            updateStats();
        }
    }
}

function updateSharedItem(itemId, field, value) {
    const item = sharedItems.find(i => i.id === itemId);
    if (item) {
        item[field] = field === 'price' ? parseFloat(value) || 0 : value;
        
        if (field === 'price' && item.sharedWith.length === 0 && item.price > 0) {
            alert('⚠️ This shared item has no people selected!');
        }
        
        render();
    }
}

function toggleSharedWith(itemId, personId) {
    const item = sharedItems.find(i => i.id === itemId);
    if (item) {
        const index = item.sharedWith.indexOf(personId);
        if (index > -1) {
            item.sharedWith.splice(index, 1);
        } else {
            item.sharedWith.push(personId);
        }
        render();
    }
}

function toggleSharedWithAll(itemId) {
    const item = sharedItems.find(i => i.id === itemId);
    if (item) {
        if (item.sharedWith.length === people.length) {
            item.sharedWith = [];
        } else {
            item.sharedWith = people.map(p => p.id);
        }
        render();
    }
}

function calculateTotals() {
    const subtotal = people.reduce((sum, p) => 
        sum + p.items.reduce((itemSum, item) => itemSum + item.price, 0), 0
    );
    
    const sharedSubtotal = sharedItems.reduce((sum, item) => sum + item.price, 0);
    const totalSubtotal = subtotal + sharedSubtotal;
    
    const taxAmount = parseFloat(document.getElementById('taxAmount').value) || 0;
    const tipAmount = parseFloat(document.getElementById('tipAmount').value) || 0;
    
    const totals = people.map(p => {
        const personSubtotal = p.items.reduce((sum, item) => sum + item.price, 0);
        
        const personSharedSubtotal = sharedItems.reduce((sum, item) => {
            if (item.sharedWith.includes(p.id) && item.sharedWith.length > 0) {
                return sum + (item.price / item.sharedWith.length);
            }
            return sum;
        }, 0);
        
        const personTotalSubtotal = personSubtotal + personSharedSubtotal;
        
        let personTax, personTip, proportion;
        
        if (splitMethod === 'even') {
            const numPeople = people.length;
            personTax = numPeople > 0 ? taxAmount / numPeople : 0;
            personTip = numPeople > 0 ? tipAmount / numPeople : 0;
            proportion = numPeople > 0 ? 1 / numPeople : 0;
        } else {
            proportion = totalSubtotal > 0 ? personTotalSubtotal / totalSubtotal : 0;
            personTax = taxAmount * proportion;
            personTip = tipAmount * proportion;
        }
        
        const total = personTotalSubtotal + personTax + personTip;
        
        return {
            ...p,
            subtotal: personSubtotal,
            sharedSubtotal: personSharedSubtotal,
            totalSubtotal: personTotalSubtotal,
            tax: personTax,
            tip: personTip,
            total: total,
            proportion: proportion
        };
    });
    
    const grandTotal = totalSubtotal + taxAmount + tipAmount;
    return { totals, grandTotal, subtotal: totalSubtotal, taxAmount, tipAmount };
}

function updateStats() {
    const { grandTotal } = calculateTotals();
    const totalItems = people.reduce((sum, p) => sum + p.items.length, 0) + sharedItems.length;
    
    document.getElementById('peopleCount').textContent = people.length;
    document.getElementById('itemsCount').textContent = totalItems;
    document.getElementById('totalAmount').textContent = `$${grandTotal.toFixed(2)}`;
    document.getElementById('bottomBarTotal').textContent = `$${grandTotal.toFixed(2)}`;
    
    if (people.length > 0 || sharedItems.length > 0) {
        document.getElementById('statsBar').style.display = 'flex';
    } else {
        document.getElementById('statsBar').style.display = 'none';
    }
}

function updateAllPersonTotals() {
    const { totals } = calculateTotals();
    
    totals.forEach(personData => {
        const personColumn = document.querySelector(`[data-person-id="${personData.id}"]`);
        if (personColumn) {
            const totalDiv = personColumn.querySelector('.person-total');
            if (totalDiv) {
                totalDiv.innerHTML = `
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">
                        Items: $${personData.subtotal.toFixed(2)}<br>
                        ${personData.sharedSubtotal > 0 ? `Shared: $${personData.sharedSubtotal.toFixed(2)}<br>` : ''}
                        Tax: $${personData.tax.toFixed(2)}<br>
                        Tip: $${personData.tip.toFixed(2)}
                    </div>
                    <div style="font-size: 16px; font-weight: 700;">
                        Total: $${personData.total.toFixed(2)}
                    </div>
                `;
            }
        }
    });
    
    updateStats();
}

function render() {
    const peopleGridEl = document.getElementById('peopleGrid');
    const sharedGridEl = document.getElementById('sharedGrid');
    if (peopleGridEl) peopleGridEl.innerHTML = '';
    if (sharedGridEl) sharedGridEl.innerHTML = '';
    
    renderPeopleGrid();
    renderSharedGrid();
    renderSummary();
    updateStats();
}

function renderPeopleGrid() {
    const grid = document.getElementById('peopleGrid');
    const { totals } = calculateTotals();
    
    if (people.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No people yet</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = people.map(person => {
        const personData = totals.find(t => t.id === person.id);
        
        return `
            <div class="person-column" data-person-id="${person.id}">
                <div class="person-header" style="margin-bottom: 15px; justify-content: space-between; align-items: center; display: flex;">
                    <h3 style="flex: 1; margin: 0; color: var(--accent-blue); font-size: 18px; font-weight: 700;">👤 ${person.name}</h3>
                    <button class="btn-remove-person" style="margin-left: 10px; min-width: 36px; min-height: 36px; font-size: 22px; padding: 0; display: flex; align-items: center; justify-content: center;" onclick="removePerson(${person.id})">×</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <input 
                        type="text" 
                        placeholder="Name" 
                        value="${person.name}"
                        onblur="updatePersonName(${person.id}, this.value)"
                        onkeypress="if(event.key === 'Enter') { this.blur(); }"
                        style="width: 100%;"
                    />
                </div>
                
                <div class="items-list">
                    ${person.items.map(item => `
                        <div class="item">
                            <input 
                                type="text" 
                                placeholder="Item" 
                                value="${item.name}"
                                onblur="updateItem(${person.id}, ${item.id}, 'name', this.value)"
                                onkeypress="if(event.key === 'Enter') { this.blur(); }"
                            />
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                step="0.01"
                                value="${item.price || ''}"
                                onblur="updateItem(${person.id}, ${item.id}, 'price', this.value)"
                                onkeypress="if(event.key === 'Enter') { this.blur(); }"
                            />
                            <button class="btn-remove-item" onclick="removeItem(${person.id}, ${item.id})">×</button>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn-add-item" onclick="addItem(${person.id})">+ Add Item</button>
            </div>
        `;
    }).join('');
}

function renderSharedGrid() {
    const grid = document.getElementById('sharedGrid');
    
    if (sharedItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍽️</div>
                <div class="empty-state-text">No shared items yet</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = sharedItems.map(item => `
        <div class="person-column shared-column">
            <div class="person-header" style="margin-bottom: 15px; justify-content: space-between; align-items: center; display: flex;">
                <h3 style="flex: 1; margin: 0; color: var(--accent-orange-dark); font-size: 18px; font-weight: 700;">🍽️ ${item.name || 'Shared Item'}</h3>
                <button class="btn-remove-person" style="margin-left: 10px; min-width: 36px; min-height: 36px; font-size: 22px; padding: 0; display: flex; align-items: center; justify-content: center;" onclick="removeSharedItem(${item.id})">×</button>
            </div>
            
            <div class="items-list">
                <div class="item">
                    <input 
                        type="text" 
                        placeholder="Item" 
                        value="${item.name}"
                        onblur="updateSharedItem(${item.id}, 'name', this.value)"
                        onkeypress="if(event.key === 'Enter') { this.blur(); }"
                    />
                    <input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        value="${item.price || ''}"
                        onblur="updateSharedItem(${item.id}, 'price', this.value)"
                        onkeypress="if(event.key === 'Enter') { this.blur(); }"
                    />
                </div>
            </div>
            
            <div class="shared-with">
                <div class="shared-with-header">Shared with:</div>
                <label class="person-checkbox select-all">
                    <input 
                        type="checkbox" 
                        id="all-${item.id}"
                        ${item.sharedWith.length === people.length ? 'checked' : ''}
                        onchange="toggleSharedWithAll(${item.id})"
                    />
                    <span>All</span>
                </label>
                ${people.map(p => `
                    <label class="person-checkbox">
                        <input 
                            type="checkbox" 
                            id="share-${item.id}-${p.id}"
                            ${item.sharedWith.includes(p.id) ? 'checked' : ''}
                            onchange="toggleSharedWith(${item.id}, ${p.id})"
                        />
                        <span>${p.name}</span>
                    </label>
                `).join('')}
            </div>
            
            ${item.sharedWith.length > 0 ? `
                <div class="person-total">
                    <div style="font-size: 14px;">
                        ${(item.price / item.sharedWith.length).toFixed(2)} per person
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderSummary() {
    const { totals, grandTotal, subtotal, taxAmount, tipAmount } = calculateTotals();
    const summaryDiv = document.getElementById('summary');
    
    const hasItems = people.some(p => p.items.length > 0 && p.items.some(item => item.price > 0)) || 
                     sharedItems.some(item => item.price > 0);
    
    if (people.length > 0 && grandTotal > 0 && hasItems) {
        summaryDiv.innerHTML = `
            <h2>📊 Bill Summary</h2>
            ${totals.map(person => {
                const percentage = ((person.total / grandTotal) * 100).toFixed(1);
                const personSharedItems = sharedItems.filter(item => item.sharedWith.includes(person.id));
                
                return `
                    <div class="summary-item">
                        <div style="flex: 1;">
                            <strong>${person.name}</strong>
                            <span class="percentage"> (${percentage}% of total)</span>
                            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; line-height: 1.6;">
                                ${person.items.length > 0 ? person.items.map(item => 
                                    `• ${item.name || 'Item'}: $${item.price.toFixed(2)}`
                                ).join('<br>') : ''}
                                ${personSharedItems.length > 0 ? personSharedItems.map(item => 
                                    `<br>• ${item.name || 'Shared Item'}: $${(item.price / item.sharedWith.length).toFixed(2)} <span class="shared-indicator">(shared with ${item.sharedWith.length})</span>`
                                ).join('') : ''}
                                ${person.items.length === 0 && personSharedItems.length === 0 ? '• No items' : ''}
                                <br><span style="color: var(--text-detail);">Subtotal: $${person.totalSubtotal.toFixed(2)}</span>
                                <br><span style="color: var(--text-detail);">Tax: $${person.tax.toFixed(2)}</span>
                                <br><span style="color: var(--text-detail);">Tip: $${person.tip.toFixed(2)}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <strong style="font-size: 18px; color: var(--accent-blue);">${person.total.toFixed(2)}</strong>
                        </div>
                    </div>
                `;
            }).join('')}
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border-summary-total); color: var(--text-secondary); font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Items Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Tax:</span>
                    <span>$${taxAmount.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Tip:</span>
                    <span>$${tipAmount.toFixed(2)}</span>
                </div>
            </div>
            <div class="summary-total">
                <span>Total Bill</span>
                <span>$${grandTotal.toFixed(2)}</span>
            </div>
        `;
    } else {
        summaryDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">No items to summarize</div>
                <div class="empty-state-subtext">Add people and items to see the breakdown</div>
            </div>
        `;
    }
}

async function exportImage() {
    const element = document.getElementById('summary');
    
    if (!element.innerHTML || element.innerHTML.includes('empty-state')) {
        alert('Please add some items before exporting.');
        return;
    }
    
    const exportBtns = document.querySelectorAll('.btn-export, .bottom-bar-button');
    exportBtns.forEach(btn => {
        btn.disabled = true;
        btn.textContent = btn.classList.contains('bottom-bar-button') ? '⏳ Exporting...' : '⏳ Exporting...';
    });
    
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: document.body.classList.contains('dark') ? '#1a1a1a' : '#f0f0f0',
            scale: 2
        });
        
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bill-split-' + new Date().getTime() + '.png';
            a.click();
            URL.revokeObjectURL(url);
            
            exportBtns.forEach(btn => {
                btn.disabled = false;
                btn.textContent = btn.classList.contains('bottom-bar-button') ? '📸 Export' : '📸 Export Summary';
            });
        });
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image. Please try again.');
        
        exportBtns.forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.classList.contains('bottom-bar-button') ? '📸 Export' : '📸 Export Summary';
        });
    }
}

addPerson();
addPerson();

document.getElementById('taxAmount').value = 0;
document.getElementById('tipAmount').value = 0;
document.getElementById('bottomBarTotal').textContent = "$0.00";
document.getElementById('totalAmount').textContent = "$0.00";
