  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.cards.length === 0) {
        alert("Mohon tambah kartu kredit terlebih dahulu di menu Kartu.");
        return;
    }
    if (!txCardId) {
        alert("Silakan pilih kartu kredit untuk transaksi ini.");
        return;
    }

    let updatedInstallments = [...data.installments];
    let updatedSavings = [...data.savings];
    let finalIsInstallment = txIsInstallment;
    let amountVal = getNumericValue(txAmount); 

    // Fitur Auto-Fill: Jika nominal 0, tipe Payment, dan Pay From Savings aktif
    // Maka otomatis isi nominal sesuai tagihan (atau sisa tabungan jika kurang)
    if (amountVal === 0 && txType === TransactionType.PAYMENT && payFromSavings && !editingTransaction) {
         const report = getMonthlyReportData(txCardId, txTargetMonth, txTargetYear);
         const bill = Math.max(0, report.remaining);
         
         const available = data.savings
            .filter(s => s.cardId === txCardId && !s.isTransferred)
            .reduce((sum, s) => sum + s.amount, 0);
            
         if (bill > 0 && available > 0) {
             amountVal = Math.min(bill, available);
         }
    }

    if (amountVal === 0) {
        alert("Nominal transaksi harus lebih dari 0. (Atau tidak ada tagihan/saldo tabungan untuk pembayaran otomatis).");
        return;
    }

    const finalDesc = txDesc || (txType === TransactionType.EXPENSE ? 'Pengeluaran' : 'Pembayaran');
    let generatedInstallmentId: string | undefined = undefined;

    if (txIsInstallment && txType === TransactionType.EXPENSE) {
       if (txInstallmentMonths <= 0) {
           alert("Lama cicilan minimal 1 bulan");
           return;
       }

       if (!editingTransaction || (editingTransaction && !editingTransaction.isInstallment)) {
          const selectedCard = data.cards.find(c => c.id === txCardId);
          let instStartDateObj = new Date(txDate);
          
          if (selectedCard && selectedCard.dueDay) {
              if (instStartDateObj.getDate() > selectedCard.dueDay) {
                  instStartDateObj.setMonth(instStartDateObj.getMonth() + 1);
              }
          }

          const newInstId = generateId();
          generatedInstallmentId = newInstId;

          const newInstallment: Installment = {
              id: newInstId,
              cardId: txCardId,
              name: finalDesc,
              totalAmount: amountVal,
              monthlyAmount: amountVal / txInstallmentMonths,
              totalMonths: txInstallmentMonths,
              monthsPaid: 0,
              startDate: instStartDateObj.toISOString() 
          };
          updatedInstallments = [newInstallment, ...updatedInstallments];
       }
    } else {
        finalIsInstallment = false;
    }

    if (txType === TransactionType.PAYMENT && payFromSavings && !editingTransaction) {
        const totalAvailable = updatedSavings
            .filter(s => s.cardId === txCardId && !s.isTransferred)
            .reduce((sum, s) => sum + s.amount, 0);
        
        if (amountVal > totalAvailable) {
            alert(`Saldo tabungan tidak mencukupi. Tersedia: ${formatIDR(totalAvailable)}`);
            return;
        }

        updatedSavings = consumeSavings(txCardId, amountVal, updatedSavings);
    }

    if (editingTransaction) {
      if (editingTransaction.isInstallment) {
          updatedInstallments = updatedInstallments.map(inst => {
              if (editingTransaction.installmentId && inst.id === editingTransaction.installmentId) {
                   return { 
                      ...inst, 
                      cardId: txCardId, 
                      name: finalDesc, 
                      startDate: new Date(txDate).toISOString(), 
                  };
              }

              const isMatch = (
                  inst.cardId === editingTransaction.cardId &&
                  inst.totalAmount === editingTransaction.amount &&
                  inst.name === editingTransaction.description
              );
              
              if (isMatch && !editingTransaction.installmentId) {
                  return { 
                      ...inst, 
                      cardId: txCardId, 
                      name: finalDesc, 
                      startDate: new Date(txDate).toISOString(), 
                  }; 
              }
              return inst;
          });
      }

      const updatedTransactions = data.transactions.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            cardId: txCardId,
            amount: amountVal,
            date: new Date(txDate).toISOString(),
            description: finalDesc,
            type: txType,
            isInstallment: finalIsInstallment,
            installmentId: generatedInstallmentId || t.installmentId,
            targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined
          };
        }
        return t;
      });
      saveData({ ...data, transactions: updatedTransactions, installments: updatedInstallments, savings: updatedSavings });
      setEditingTransaction(null);
    } else {
      const newTransaction: Transaction = {
        id: generateId(),
        cardId: txCardId,
        amount: amountVal,
        date: new Date(txDate).toISOString(),
        description: finalDesc,
        type: txType,
        category: payFromSavings ? 'Payment from Savings' : 'General',
        isValidated: false,
        isInstallment: finalIsInstallment,
        installmentId: generatedInstallmentId,
        targetPeriod: txType === TransactionType.PAYMENT ? { month: txTargetMonth, year: txTargetYear } : undefined
      };
      saveData({
        ...data,
        transactions: [newTransaction, ...data.transactions],
        installments: updatedInstallments,
        savings: updatedSavings
      });
    }

    setTxAmount('');
    setTxDesc('');
    setTransactionModalOpen(false);
  };