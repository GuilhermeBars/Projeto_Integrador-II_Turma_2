import dotenv from 'dotenv'; 
import {resolve} from 'path'; 
import OracleDB from 'oracledb';
import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: resolve('C:/workspace/outros/.env') });

export namespace walletHandler {
    export type Wallet = {
        email: string;
        balance: number;
        transactionHistory: { tipo: 'credito' | 'apostar' | 'saque' | 'pix' | 'bank', amount: number, data: string }[];
    };
    
    // Função para adicionar uma carteira ao banco de dados Oracle
    export async function createWallet(email: string): Promise<Wallet> {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
    
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    
        await connection.execute(
            'INSERT INTO WALLETS (EMAIL, BALANCE) VALUES (:email, :balance)',
            [email, 0],
            { autoCommit: true }
        );
    
        await connection.close();
    
        return {
            email: email,
            balance: 0,
            transactionHistory: []
        };
    }
    
    // Função para encontrar uma carteira pelo email
    export async function findWallet(email: string): Promise<Wallet | null> {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
    
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });
    
        const result: any = await connection.execute(
            'SELECT * FROM WALLETS WHERE EMAIL = :email',
            [email]
        );
    
        await connection.close();
    
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                email: row.EMAIL,
                balance: row.BALANCE,
                transactionHistory: [] // Carregar histórico de transações se necessário
            };
        }
        return null;
    }
    
    // Função para atualizar o saldo da carteira e registrar transação
    async function updateWalletBalanceAndRecordTransaction(email: string, newBalance: number, transactionType: string, amount: number): Promise<void> {
        let connection;
        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });
    
            // Atualiza o saldo no banco de dados
            await connection.execute(
                'UPDATE WALLETS SET BALANCE = :balance WHERE EMAIL = :email',
                [newBalance, email],
                { autoCommit: true }
            );
    
            // Adiciona a transação ao histórico de transações
            await connection.execute(
                'INSERT INTO TRANSACTIONS (TRANSACTION_ID, EMAIL, TYPE_, AMOUNT, DATE_) VALUES (SEQ_TRANSACTIONS.NEXTVAL, :email, :type, :amount, SYSDATE)',
                [email, transactionType, amount],
                { autoCommit: true }
            );
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
    
    // Função para calcular a taxa de saque
    function calculateWithdrawalFee(amount: number): number {
        if (amount <= 100) {
            return amount * 0.04;
        } else if (amount <= 1000) {
            return amount * 0.03;
        } else if (amount <= 5000) {
            return amount * 0.02;
        } else if (amount <= 100000) {
            return amount * 0.01;
        } else {
            return 0;
        }
    }
    
// Rota para depósito de cartao de credito / adicionar fundos à carteira do usuário
export const addFundsToWalletRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEmail = req.get('email');
    const pAmount = Number(req.get('amount'));
    const pCardNumber = req.get('cardNumber');
    const pCardName = req.get('cardName');
    const pCardExpiration = req.get('cardExpiration');
    const pCardCVV = req.get('cardCVV');

    // Função para validar número do cartão usando Regex
    const isValidCardNumber = (cardNumber: string) => {
        const visaRegex = /^4[0-9]{12}(?:[0-9]{3})?$/;
        const masterCardRegex = /^(5[1-5][0-9]{14}|2(2[2-9][0-9]{13}|[3-6][0-9]{14}|7[01][0-9]{13}|720[0-9]{12}))$/;
        return visaRegex.test(cardNumber) || masterCardRegex.test(cardNumber);
    };

    // Função para validar a data de expiração (MM/YY)
    const isValidExpirationDate = (expirationDate: string) => {
        const [month, year] = expirationDate.split('/').map(Number);
        if (!month || !year || month < 1 || month > 12) return false;

        const currentDate = new Date();
        const currentYear = parseInt(currentDate.getFullYear().toString().slice(-2));
        const currentMonth = currentDate.getMonth() + 1;

        return year > currentYear || (year === currentYear && month >= currentMonth);
    };

    // Função para validar o CVV (deve ter 3 ou 4 dígitos)
    const isValidCVV = (cvv: string) => {
        return /^[0-9]{3,4}$/.test(cvv);
    };

    if (!pEmail || isNaN(pAmount) || pAmount <= 0) {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
        return;
    }

    if (!pCardNumber || !isValidCardNumber(pCardNumber)) {
        res.status(400).send("Número do cartão de crédito inválido.");
        return;
    }

    if (!pCardExpiration || !isValidExpirationDate(pCardExpiration)) {
        res.status(400).send("Data de expiração do cartão inválida.");
        return;
    }

    if (!pCardCVV || !isValidCVV(pCardCVV)) {
        res.status(400).send("CVV do cartão inválido.");
        return;
    }

    let wallet = await findWallet(pEmail);
    if (!wallet) {
        wallet = await createWallet(pEmail);
    }

    // Atualizar saldo após recebimento (simulação)
    wallet.balance += pAmount;

    res.status(200).send("Fundos adicionados com sucesso.");
};

    
    // Rota para sacar fundos da carteira do usuário
    export const withdrawFundsRoute: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email');
        const pAmount = Number(req.get('amount'));
        const pTransferType:any = req.get('transferType'); // Tipo de transferência: 'pix' ou 'bank'
        
        if (pEmail && !isNaN(pAmount) && pAmount > 0 ) {
            let wallet = await findWallet(pEmail);
            if (wallet) {
                // Calcula a taxa de saque
                const fee = calculateWithdrawalFee(pAmount);
                const totalAmount = pAmount + fee;
    
                // Verifica se a carteira tem saldo suficiente
                if (wallet.balance >= totalAmount) {
                    wallet.balance -= totalAmount;
    
                    if (pTransferType === 'bank') {
                        const pBankDetails = req.body.bankDetails; // Detalhes bancários para o saque
                        res.status(200).send(`Saque via transferência bancária para a conta: Agência ${pBankDetails.agency}, Conta ${pBankDetails.accountNumber}`);
                    } else if (pTransferType === 'pix') {
                        const user_pix_key = req.get('user_pix_key');
    
                        res.status(200).send(`Saque via PIX para a chave: ${user_pix_key}`);
                    }
    
                    try {
                        await updateWalletBalanceAndRecordTransaction(pEmail, wallet.balance, pTransferType, pAmount);
                        res.status(200).send(`Saque de R$${pAmount} realizado com sucesso via ${pTransferType}. Taxa de saque: R$${fee}. Saldo atual: R$${wallet.balance}`);
                    } catch (error) {
                        res.status(500).send("Erro ao processar a transação.");
                    }
                } else {
                    res.status(400).send("Saldo insuficiente para realizar o saque.");
                }
            } else {
                res.status(404).send("Wallet não encontrada.");
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    };
    
    // Rota para apostar em um evento
    export const betOnEventRoute: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email');
        const pEventId = req.get('eventId');
        const pBetAmount = Number(req.get('betAmount'));
    
        if (pEmail && pEventId && !isNaN(pBetAmount) && pBetAmount > 0) {
            let wallet = await findWallet(pEmail);
            if (wallet) {
                // Verifica se a carteira tem saldo suficiente para a aposta
                if (wallet.balance >= pBetAmount) {
                    let connection;
                    try {
                        connection = await OracleDB.getConnection({
                            user: process.env.ORACLE_USER,
                            password: process.env.ORACLE_PASSWORD,
                            connectString: process.env.ORACLE_CONN_STR
                        });
    
                        // Deduz o valor da aposta do saldo da carteira
                        wallet.balance -= pBetAmount;
    
                        // Atualiza o saldo e registra a transação de aposta
                        await updateWalletBalanceAndRecordTransaction(pEmail, wallet.balance, 'apostar', pBetAmount);
    
                        // Registra a aposta no banco de dados
                        await connection.execute(
                            'INSERT INTO BETS (BET_ID, EMAIL, EVENT_ID, BET_AMOUNT, DATE_) VALUES (SEQ_BETS.NEXTVAL, :email, :eventId, :betAmount, SYSDATE)',
                            [pEmail, pEventId, pBetAmount],
                            { autoCommit: true }
                        );
    
                        res.status(200).send(`Aposta de R$${pBetAmount} realizada com sucesso no evento ${pEventId}. Saldo atual: R$${wallet.balance}`);
                    } catch (error) {
                        res.status(500).send("Erro ao processar a aposta.");
                    } finally {
                        if (connection) {
                            await connection.close();
                        }
                    }
                } else {
                    res.status(400).send("Saldo insuficiente para realizar a aposta.");
                }
            } else {
                res.status(404).send("Wallet não encontrada.");
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    };
    // Rota para encerrar um evento e distribuir os ganhos (acessível apenas por moderadores)
    export const finishEventRoute: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email');
        if (!pEmail) {
            res.status(400).send("Email do usuário não fornecido.");
            return;
        }
    
        let connection;
        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });
    
            // Verifica se o usuário é um moderador no banco de dados
            const moderatorResult: any = await connection.execute(
                'SELECT USER_TYPE FROM ACCOUNTS WHERE EMAIL = :email',
                [pEmail]
            );
    
            if (moderatorResult.rows.length === 0 || moderatorResult.rows[0][0] !== 'moderator') {
                res.status(403).send("Acesso negado. Apenas moderadores podem encerrar eventos.");
                return;
            }            

        } catch (error) {
            res.status(500).send("Erro ao verificar as credenciais do usuário.");
            return;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    
        const pEventId = req.get('eventId');
        const pResult = req.get('result'); // Resultado do evento (ex: 'win', 'lose')
    
        if (pEventId && pResult) {
            let connection;
            try {
                connection = await OracleDB.getConnection({
                    user: process.env.ORACLE_USER,
                    password: process.env.ORACLE_PASSWORD,
                    connectString: process.env.ORACLE_CONN_STR
                });
    
                // Busca todas as apostas do evento
                const betsResult: any = await connection.execute(
                    'SELECT * FROM BETS WHERE EVENT_ID = :eventId',
                    [pEventId]
                );
    
                if (betsResult.rows.length > 0) {
                    for (const bet of betsResult.rows) {
                        const betEmail = bet.EMAIL;
                        const betAmount = bet.BETAMOUNT;
                        let rewardAmount = 0;
    
                        if (pResult === 'win') {
                            rewardAmount = betAmount * 2;
                        }
    
                        if (rewardAmount > 0) {
                            let wallet = await findWallet(betEmail);
                            if (wallet) {
                                wallet.balance += rewardAmount;
                                await updateWalletBalanceAndRecordTransaction(betEmail, wallet.balance, 'ganho', rewardAmount);
                            }
                        }
                    }
                }
    
                // Remove as apostas do evento encerrado
                await connection.execute(
                    'DELETE FROM BETS WHERE EVENT_ID = :eventId',
                    [pEventId],
                    { autoCommit: true }
                );

                // Deleta o evento encerrado
                await connection.execute(
                    'DELETE FROM EVENTS WHERE EVENT_ID = :eventId',
                    [pEventId],
                    { autoCommit: true }
                );
    
                res.status(200).send(`Evento ${pEventId} encerrado com sucesso e ganhos distribuídos.`);
            } catch (error) {
                console.error('Erro ao encerrar o evento:', error);
                res.status(500).send("Erro ao encerrar o evento.");
            }
            finally {
                if (connection) {
                    await connection.close();
                }
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    };

}
