// 記帳工具 JavaScript 功能

class AccountingApp {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('accountingRecords')) || [];
        this.categories = JSON.parse(localStorage.getItem('accountingCategories')) || [
            '飲食', '交通', '購物', '娛樂', '醫療', '教育', '其他'
        ];
        this.budgets = JSON.parse(localStorage.getItem('accountingBudgets')) || [];
        this.currentFilters = {
            year: '',
            month: '',
            category: ''
        };
        
        // 匯率設定（簡化版本，實際應用中應該從API獲取）
        this.exchangeRates = {
            TWD: 1,
            USD: 0.032,
            EUR: 0.030,
            JPY: 4.8,
            CNY: 0.23,
            HKD: 0.25
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.updateRecordsDisplay();
        this.updateBudgetDisplay();
        this.setCurrentDate();
        this.updateFilterOptions();
        
        // 設置預設顯示新增記錄區塊
        this.switchSection('form-section');
    }

    setupEventListeners() {
        // 表單提交
        document.getElementById('accountingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // 新增類別按鈕
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showCategoryModal();
        });

        // 刪除類別按鈕
        document.getElementById('deleteCategoryBtn').addEventListener('click', () => {
            this.showDeleteCategoryModal();
        });

        // 類型選擇變化時更新類別選項
        document.getElementById('type').addEventListener('change', () => {
            this.updateCategoryOptions();
        });

        // 模態對話框事件
        const categoryModal = document.getElementById('categoryModal');
        const deleteCategoryModal = document.getElementById('deleteCategoryModal');
        const closeBtns = document.querySelectorAll('.close');
        const saveCategoryBtn = document.getElementById('saveCategoryBtn');
        const confirmDeleteCategoryBtn = document.getElementById('confirmDeleteCategoryBtn');

        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideCategoryModal();
                this.hideDeleteCategoryModal();
            });
        });

        saveCategoryBtn.addEventListener('click', () => {
            this.addCategory();
        });

        confirmDeleteCategoryBtn.addEventListener('click', () => {
            this.deleteCategory();
        });

        // 點擊模態對話框外部關閉
        window.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                this.hideCategoryModal();
            }
            if (e.target === deleteCategoryModal) {
                this.hideDeleteCategoryModal();
            }
        });

        // 篩選器事件
        document.getElementById('filterYear').addEventListener('change', (e) => {
            this.currentFilters.year = e.target.value;
            this.updateRecordsDisplay();
        });

        document.getElementById('filterMonth').addEventListener('change', (e) => {
            this.currentFilters.month = e.target.value;
            this.updateRecordsDisplay();
        });

        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.updateRecordsDisplay();
        });

        // 頂部tab導航事件
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSection(btn.dataset.section);
            });
        });

        // 匯出數據按鈕
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // 預算設定按鈕
        document.getElementById('setBudgetBtn').addEventListener('click', () => {
            this.setBudget();
        });
    }

    setCurrentDate() {
        const now = new Date();
        const yearInput = document.getElementById('year');
        const monthInput = document.getElementById('month');
        
        yearInput.value = now.getFullYear();
        monthInput.value = now.getMonth() + 1;
    }

    addRecord() {
        const formData = new FormData(document.getElementById('accountingForm'));
        const year = parseInt(formData.get('year'));
        const month = parseInt(formData.get('month'));
        const type = formData.get('type');
        const currency = formData.get('currency');
        const amount = parseFloat(formData.get('amount'));
        const category = formData.get('category');
        const description = formData.get('description');

        // 驗證數據
        if (!year || !month || !type || !currency || !amount || !category) {
            this.showNotification('請填寫所有必填欄位', 'error');
            return;
        }

        if (year < 1900 || year > 2100) {
            this.showNotification('年份必須在 1900-2100 之間', 'error');
            return;
        }

        if (month < 1 || month > 12) {
            this.showNotification('月份必須在 1-12 之間', 'error');
            return;
        }

        if (amount <= 0) {
            this.showNotification('金額必須大於 0', 'error');
            return;
        }

        // 創建新記錄
        const record = {
            id: Date.now(),
            year,
            month,
            type,
            currency,
            amount,
            category,
            description: description || '',
            date: new Date().toISOString()
        };

        this.records.push(record);
        this.saveRecords();
        this.updateRecordsDisplay();
        this.updateBudgetDisplay();
        this.updateFilterOptions();

        // 重置表單
        document.getElementById('accountingForm').reset();
        this.setCurrentDate();

        this.showNotification('記錄新增成功！', 'success');
    }

    deleteRecord(id) {
        if (confirm('確定要刪除這筆記錄嗎？')) {
            this.records = this.records.filter(record => record.id !== id);
            this.saveRecords();
            this.updateRecordsDisplay();
            this.updateFilterOptions();
            this.showNotification('記錄已刪除', 'success');
        }
    }

    showCategoryModal() {
        document.getElementById('categoryModal').style.display = 'block';
        document.getElementById('newCategory').focus();
    }

    hideCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
        document.getElementById('newCategory').value = '';
    }

    showDeleteCategoryModal() {
        const deleteCategorySelect = document.getElementById('deleteCategory');
        deleteCategorySelect.innerHTML = '<option value="">請選擇類別</option>';
        
        // 顯示所有類別（包括預設類別和自定義類別）
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            deleteCategorySelect.appendChild(option);
        });
        
        document.getElementById('deleteCategoryModal').style.display = 'block';
    }

    hideDeleteCategoryModal() {
        document.getElementById('deleteCategoryModal').style.display = 'none';
        document.getElementById('deleteCategory').value = '';
    }

    addCategory() {
        const newCategory = document.getElementById('newCategory').value.trim();
        
        if (!newCategory) {
            this.showNotification('請輸入類別名稱', 'error');
            return;
        }

        if (this.categories.includes(newCategory)) {
            this.showNotification('此類別已存在', 'error');
            return;
        }

        this.categories.push(newCategory);
        this.saveCategories();
        this.loadCategories();
        this.updateFilterOptions();
        this.hideCategoryModal();
        this.showNotification('類別新增成功！', 'success');
    }

    deleteCategory() {
        const categoryToDelete = document.getElementById('deleteCategory').value;
        
        if (!categoryToDelete) {
            this.showNotification('請選擇要刪除的類別', 'error');
            return;
        }

        // 將該類別的所有記錄改為「其他」類別
        this.records.forEach(record => {
            if (record.category === categoryToDelete) {
                record.category = '其他';
            }
        });

        // 從類別列表中移除
        this.categories = this.categories.filter(cat => cat !== categoryToDelete);
        
        this.saveRecords();
        this.saveCategories();
        this.loadCategories();
        this.updateFilterOptions();
        this.updateRecordsDisplay();
        this.hideDeleteCategoryModal();
        this.showNotification('類別刪除成功！', 'success');
    }

    loadCategories() {
        const categorySelect = document.getElementById('category');
        const filterCategorySelect = document.getElementById('filterCategory');
        
        // 清空現有選項（保留預設選項）
        categorySelect.innerHTML = '<option value="">請選擇類別</option>';
        filterCategorySelect.innerHTML = '<option value="">全部類別</option>';
        
        // 添加類別選項
        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category;
            option1.textContent = category;
            categorySelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = category;
            option2.textContent = category;
            filterCategorySelect.appendChild(option2);
        });
    }

    updateCategoryOptions() {
        const type = document.getElementById('type').value;
        const categorySelect = document.getElementById('category');
        
        // 根據類型調整類別選項
        if (type === 'income') {
            // 收入類別
            const incomeCategories = ['薪資', '獎金', '投資', '其他收入'];
            categorySelect.innerHTML = '<option value="">請選擇類別</option>';
            incomeCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } else if (type === 'expense') {
            // 支出類別，使用原有類別
            this.loadCategories();
        }
    }

    updateFilterOptions() {
        const filterYearSelect = document.getElementById('filterYear');
        const years = [...new Set(this.records.map(record => record.year))].sort((a, b) => b - a);
        
        // 清空現有選項（保留預設選項）
        filterYearSelect.innerHTML = '<option value="">全部年份</option>';
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filterYearSelect.appendChild(option);
        });
    }

    updateRecordsDisplay() {
        const filteredRecords = this.getFilteredRecords();
        const tbody = document.getElementById('recordsTableBody');
        
        tbody.innerHTML = '';
        
        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">沒有找到記錄</td></tr>';
        } else {
            filteredRecords.forEach(record => {
                const row = this.createRecordRow(record);
                tbody.appendChild(row);
            });
        }
        
        this.updateSummary(filteredRecords);
    }

    getFilteredRecords() {
        return this.records.filter(record => {
            if (this.currentFilters.year && record.year !== parseInt(this.currentFilters.year)) {
                return false;
            }
            if (this.currentFilters.month && record.month !== parseInt(this.currentFilters.month)) {
                return false;
            }
            if (this.currentFilters.category && record.category !== this.currentFilters.category) {
                return false;
            }
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    createRecordRow(record) {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = `${record.year}/${record.month.toString().padStart(2, '0')}`;
        
        const typeCell = document.createElement('td');
        const typeTag = document.createElement('span');
        typeTag.className = `type-tag ${record.type}`;
        typeTag.textContent = record.type === 'income' ? '收入' : '支出';
        typeCell.appendChild(typeTag);
        
        const amountCell = document.createElement('td');
        amountCell.className = 'amount';
        const currencySymbol = this.getCurrencySymbol(record.currency);
        amountCell.textContent = `${currencySymbol} ${record.amount.toLocaleString()}`;
        
        const categoryCell = document.createElement('td');
        const categoryTag = document.createElement('span');
        categoryTag.className = 'category-tag';
        categoryTag.textContent = record.category;
        categoryCell.appendChild(categoryTag);
        
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = record.description || '-';
        
        const actionCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '刪除';
        deleteBtn.onclick = () => this.deleteRecord(record.id);
        actionCell.appendChild(deleteBtn);
        
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(categoryCell);
        row.appendChild(descriptionCell);
        row.appendChild(actionCell);
        
        return row;
    }

    updateSummary(records) {
        const totalIncome = records.filter(r => r.type === 'income').reduce((sum, record) => {
            return sum + this.convertToTWD(record.amount, record.currency);
        }, 0);
        const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, record) => {
            return sum + this.convertToTWD(record.amount, record.currency);
        }, 0);
        const netIncome = totalIncome - totalExpense;
        const totalRecords = records.length;
        
        document.getElementById('totalIncome').textContent = `NT$ ${totalIncome.toLocaleString()}`;
        document.getElementById('totalExpense').textContent = `NT$ ${totalExpense.toLocaleString()}`;
        document.getElementById('netIncome').textContent = `NT$ ${netIncome.toLocaleString()}`;
        document.getElementById('totalRecords').textContent = totalRecords;
    }

    saveRecords() {
        localStorage.setItem('accountingRecords', JSON.stringify(this.records));
    }

    saveCategories() {
        localStorage.setItem('accountingCategories', JSON.stringify(this.categories));
    }

    saveBudgets() {
        localStorage.setItem('accountingBudgets', JSON.stringify(this.budgets));
    }

    // 匯率轉換
    convertToTWD(amount, currency) {
        const rate = this.exchangeRates[currency] || 1;
        return amount / rate;
    }

    // 獲取幣別符號
    getCurrencySymbol(currency) {
        const symbols = {
            TWD: 'NT$',
            USD: '$',
            EUR: '€',
            JPY: '¥',
            CNY: '¥',
            HKD: 'HK$'
        };
        return symbols[currency] || currency;
    }

    // 數據匯出功能
    exportData() {
        const data = {
            records: this.records,
            categories: this.categories,
            budgets: this.budgets,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounting_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('數據匯出成功！', 'success');
    }

    // 預算設定功能
    setBudget() {
        const year = parseInt(document.getElementById('budgetYear').value);
        const month = parseInt(document.getElementById('budgetMonth').value);
        const amount = parseFloat(document.getElementById('budgetAmount').value);

        if (!year || !month || !amount) {
            this.showNotification('請填寫所有預算欄位', 'error');
            return;
        }

        if (year < 1900 || year > 2100) {
            this.showNotification('年份必須在 1900-2100 之間', 'error');
            return;
        }

        if (month < 1 || month > 12) {
            this.showNotification('月份必須在 1-12 之間', 'error');
            return;
        }

        if (amount <= 0) {
            this.showNotification('預算金額必須大於 0', 'error');
            return;
        }

        // 檢查是否已存在該期間的預算
        const existingBudgetIndex = this.budgets.findIndex(b => b.year === year && b.month === month);
        
        if (existingBudgetIndex !== -1) {
            // 更新現有預算
            this.budgets[existingBudgetIndex].amount = amount;
            this.showNotification('預算更新成功！', 'success');
        } else {
            // 新增預算
            const budget = {
                id: Date.now(),
                year,
                month,
                amount,
                date: new Date().toISOString()
            };
            this.budgets.push(budget);
            this.showNotification('預算設定成功！', 'success');
        }

        this.saveBudgets();
        this.updateBudgetDisplay();
        
        // 清空表單
        document.getElementById('budgetYear').value = '';
        document.getElementById('budgetMonth').value = '';
        document.getElementById('budgetAmount').value = '';
    }

    // 更新預算顯示
    updateBudgetDisplay() {
        const tbody = document.getElementById('budgetTableBody');
        tbody.innerHTML = '';

        if (this.budgets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">沒有預算記錄</td></tr>';
            return;
        }

        // 按日期排序
        const sortedBudgets = this.budgets.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

        sortedBudgets.forEach(budget => {
            const row = this.createBudgetRow(budget);
            tbody.appendChild(row);
        });
    }

    // 創建預算行
    createBudgetRow(budget) {
        const row = document.createElement('tr');
        
        // 計算實際支出
        const actualExpense = this.records
            .filter(r => r.type === 'expense' && r.year === budget.year && r.month === budget.month)
            .reduce((sum, record) => sum + this.convertToTWD(record.amount, record.currency), 0);
        
        const remainingBudget = budget.amount - actualExpense;
        const usageRate = (actualExpense / budget.amount) * 100;
        
        const periodCell = document.createElement('td');
        periodCell.textContent = `${budget.year}/${budget.month.toString().padStart(2, '0')}`;
        
        const budgetAmountCell = document.createElement('td');
        budgetAmountCell.textContent = `NT$ ${budget.amount.toLocaleString()}`;
        
        const actualExpenseCell = document.createElement('td');
        actualExpenseCell.textContent = `NT$ ${actualExpense.toLocaleString()}`;
        
        const remainingBudgetCell = document.createElement('td');
        remainingBudgetCell.textContent = `NT$ ${remainingBudget.toLocaleString()}`;
        remainingBudgetCell.style.color = remainingBudget < 0 ? '#e74c3c' : '#27ae60';
        
        const usageRateCell = document.createElement('td');
        const progressContainer = document.createElement('div');
        progressContainer.className = 'budget-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'budget-progress-bar';
        progressBar.style.width = `${Math.min(usageRate, 100)}%`;
        
        if (usageRate <= 70) {
            progressBar.classList.add('safe');
        } else if (usageRate <= 90) {
            progressBar.classList.add('warning');
        } else {
            progressBar.classList.add('danger');
        }
        
        progressContainer.appendChild(progressBar);
        usageRateCell.appendChild(progressContainer);
        usageRateCell.innerHTML += ` ${usageRate.toFixed(1)}%`;
        
        const actionCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '刪除';
        deleteBtn.onclick = () => this.deleteBudget(budget.id);
        actionCell.appendChild(deleteBtn);
        
        row.appendChild(periodCell);
        row.appendChild(budgetAmountCell);
        row.appendChild(actualExpenseCell);
        row.appendChild(remainingBudgetCell);
        row.appendChild(usageRateCell);
        row.appendChild(actionCell);
        
        return row;
    }

    // 刪除預算
    deleteBudget(id) {
        if (confirm('確定要刪除這個預算嗎？')) {
            this.budgets = this.budgets.filter(budget => budget.id !== id);
            this.saveBudgets();
            this.updateBudgetDisplay();
            this.showNotification('預算已刪除', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 設置樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        // 根據類型設置背景色
        switch (type) {
            case 'success':
                notification.style.background = '#27ae60';
                break;
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            default:
                notification.style.background = '#3498db';
        }
        
        // 添加到頁面
        document.body.appendChild(notification);
        
        // 3秒後自動移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    switchSection(sectionId) {
        // 隱藏所有區塊
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // 顯示選中的區塊
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // 更新導航項目狀態
        document.querySelectorAll('.tab-btn').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new AccountingApp();
}); 