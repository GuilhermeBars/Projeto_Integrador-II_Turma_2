import OracleDB from 'oracledb';
import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

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
        'INSERT INTO WALLETS (email, balance) VALUES (:email, :balance)',
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
        'SELECT * FROM WALLETS WHERE email = :email',
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
            'UPDATE WALLETS SET balance = :balance WHERE email = :email',
            [newBalance, email],
            { autoCommit: true }
        );

        // Adiciona a transação ao histórico de transações
        await connection.execute(
            'INSERT INTO TRANSACTIONS (email, type, amount, date) VALUES (:email, :type, :amount, SYSDATE)',
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

// Função para gerar chave PIX
function generatePixKey(): string {
    return uuidv4();
}

// Rota para adicionar fundos à carteira do usuário
export const addFundsToWalletRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEmail = req.get('email');
    const pAmount = Number(req.get('amount'));
    const pTransferType = req.get('transferType'); // Tipo de transferência: 'pix' ou 'bank'
    const pBankDetails = req.body.bankDetails; // Detalhes bancários para transferência bancária

    if (pEmail && !isNaN(pAmount) && pAmount > 0 && pTransferType) {
        let wallet = await findWallet(pEmail);
        if (!wallet) {
            wallet = await createWallet(pEmail);
        }

        if (pTransferType === 'bank') {
            res.status(200).send("Para fazer o depósito, use os seguintes dados bancários: Agência: 0001 Conta: 69265218-3");
            return;
        } else if (pTransferType === 'pix') {
            // Gerar uma chave PIX para o usuário
            const pixKey = generatePixKey();
            res.status(200).send(`Para fazer o depósito via PIX, use a chave PIX: ${pixKey}`);
            return;
        }

        // Atualizar saldo após recebimento (simulação)
        wallet.balance += pAmount;

        try {
            await updateWalletBalanceAndRecordTransaction(pEmail, wallet.balance, pTransferType, pAmount);
            res.status(200).send(`Fundos adicionados com sucesso via ${pTransferType}. Saldo atual: R$${wallet.balance}`);
        } catch (error) {
            res.status(500).send("Erro ao processar a transação.");
        }
    } else {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
    }
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


// Função para buscar eventos por palavra-chave no banco de dados Oracle
export const searchEventRoute: RequestHandler = async (req: Request, res: Response) => {
const keyword = req.get('keyword'); // Palavra-chave de busca fornecida na requisição

if (!keyword) {
    res.statusCode = 400;
    res.send("Você precisa informar uma palavra-chave para a busca.");
    return;
}

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

// Conecta ao banco de dados Oracle
const connection = await OracleDB.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STR
});

// Busca eventos que tenham a palavra-chave no título ou descrição, nao tem muito mais lugar pra procurar
const result: any = await connection.execute(
`SELECT * FROM EVENTS WHERE LOWER(title) LIKE :keyword OR LOWER(desc) LIKE :keyword`,
[ `%${keyword.toLowerCase()}%` ]
);
await connection.close(); 

if (result.rows.length > 0) {
    let eventsList = '';
    
    // Percorre todos os eventos encontrados e formata as informações
    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        eventsList += `Evento ${i + 1}:
                    ` +`Título: ${row.TITLE}
                    ` +`Descrição: ${row.DESC}
                    ` +`Time 1: ${row.TEAM1}
                    ` +`Time 2: ${row.TEAM2}
                    ` +`Data: ${row.DATE}
                    ` +`Hora: ${row.HOUR}

`;
    }
    res.statusCode = 200;
    res.send(eventsList); // Retorna os eventos encontrados cada um como uma stringzona como ali em cima 
} else {
    res.statusCode = 200;
    res.send("Nenhum evento foi encontrado que contém essa palvara.");
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
                        'INSERT INTO BETS (email, eventId, betAmount, date) VALUES (:email, :eventId, :betAmount, SYSDATE)',
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
            'SELECT tipo FROM USERS WHERE email = :email',
            [pEmail]
        );

        if (moderatorResult.rows.length === 0 || moderatorResult.rows[0].TIPO !== 'moderator') {
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
                'SELECT * FROM BETS WHERE eventId = :eventId',
                [pEventId]
            );

            if (betsResult.rows.length > 0) {
                for (const bet of betsResult.rows) {
                    const betEmail = bet.EMAIL;
                    const betAmount = bet.BETAMOUNT;
                    let rewardAmount = 0;

                    // Lógica de distribuição dos ganhos
                    if (pResult === 'win') {
                        rewardAmount = betAmount * 2; // Exemplo: dobra o valor da aposta em caso de vitória
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
                'DELETE FROM BETS WHERE eventId = :eventId',
                [pEventId],
                { autoCommit: true }
            );

            res.status(200).send(`Evento ${pEventId} encerrado com sucesso e ganhos distribuídos.`);
        } catch (error) {
            res.status(500).send("Erro ao encerrar o evento.");
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    } else {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
    }
};