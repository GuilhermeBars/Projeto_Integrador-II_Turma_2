//Falta implementar betonEvent, evaluateNewEvent, searchEvent, finishEvent
//Alterações que eu fiz a partir da linha 168


import {Request, RequestHandler, Response} from "express"; 
import OracleDB from "oracledb"; 
import dotenv from 'dotenv'; 
import {resolve} from 'path'; 

// Carrega as variáveis de ambiente a partir do arquivo .env especificado
dotenv.config({ path: resolve('C:/workspace/outros/.env') });

// Define um namespace para agrupar os manipuladores relacionados a contas e eventos
export namespace AccountsHandler {
    
    // Define o tipo UserAccount, que representa uma conta de usuário
    export type UserAccount = {
        name:string; 
        email:string; 
        password:string; 
        birthdate:string; 
    };

    // Define o tipo Event, que representa um evento
    export type Event = {
        title:string; 
        desc:string; 
        team1:string; 
        team2:string; 
        date:string; 
        hour:string; 
    }

    // Banco de dados em memória para armazenar as contas de usuário
    let accountsDatabase: UserAccount[] = [];

    // Banco de dados em memória para armazenar os eventos
    let eventsDatabase: Event[] = [];

    // Função para salvar uma nova conta no banco de dados em memória
    export function saveNewAccount(ua: UserAccount) : number{
        accountsDatabase.push(ua); 
        return accountsDatabase.length; 
    }

    // Função para salvar um novo evento no banco de dados em memória
    export function saveNewEvent(ne: Event) : number{
        eventsDatabase.push(ne); 
        return eventsDatabase.length; 
    }

    // Função assíncrona para realizar login de um usuário
    async function login(email: string, password: string) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT; // Define o formato de saída do OracleDB

        // Estabelece a conexão com o banco de dados Oracle usando as credenciais do .env
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER, 
            password: process.env.ORACLE_PASSWORD, 
            connectString: process.env.ORACLE_CONN_STR 
        });

        // Executa uma consulta para buscar contas (consulta comentada pode ser usada para autenticação)
        let accounts = await connection.execute(
            // 'SELECT * FROM ACCOUNTS WHERE email = :email AND password = :password;',
            // [email, password]
            'SELECT * FROM ACCOUNTS'
        );

        await connection.close(); // Fecha a conexão com o banco de dados

        console.log(accounts.rows); // Exibe as contas retornadas no console
    }

    // Define a rota de login para o Express
    export const loginRoute: RequestHandler = 
        async (req: Request, res: Response) => {
            const pEmail = req.get('email'); 
            const pPassword = req.get('password'); 
            if(pEmail && pPassword){
                await login(pEmail, pPassword); // Chama a função de login
                res.statusCode = 200; 
                res.send('Login realizado... confira...'); 
            } else {
                res.statusCode = 400; 
                res.send('Requisição inválida - Parâmetros faltando.');
            }
    }

    // Define a rota para criar uma nova conta de usuário
    export const createAccountRoute: RequestHandler = (req: Request, res: Response) => {
        const pName = req.get('name'); 
        const pEmail = req.get('email'); 
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
        
        if (pName && pEmail && pPassword && pBirthdate) {
            // Cria um novo objeto UserAccount com os dados fornecidos
            const newAccount: UserAccount = {
                name: pName,
                email: pEmail, 
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount); 
            res.statusCode = 200;  
            res.send(`Nova conta adicionada. Código: ${ID}`); 
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes."); 
        }
    }

    // Define a rota para adicionar um novo evento
    export const addEventRoute: RequestHandler = (req: Request, res: Response) => {
        const pTitle = req.get('title'); 
        const pDesc = req.get('desc'); 
        const pTeam1 = req.get('team1'); 
        const pTeam2 = req.get('team2');
        const pDate = req.get('date');
        const pHour = req.get('hour'); 

        if (pTitle && pDesc && pTeam1 && pTeam2 && pDate && pHour) {
            // Cria um novo objeto Event com os dados fornecidos
            const newEvent: Event = {
                title: pTitle,
                desc: pDesc,
                team1: pTeam1,
                team2: pTeam2,
                date: pDate,
                hour: pHour,
            }
            const ID = saveNewEvent(newEvent); 
            res.statusCode = 200; 
            res.send(`Novo evento adicionado. Código: ${ID}`); 
        }

        else {
            res.statusCode = 400; 
            res.send("Parâmetros inválidos ou faltantes."); 
        }
    }

    // Define a rota para obter todos os eventos armazenados
    export const getEventsRoute: RequestHandler = (req: Request, res: Response) => {
        if (eventsDatabase.length === 0) { 
            res.statusCode = 200; 
            res.send("Nenhum evento encontrado."); 
            return;
        }
    
        else {
            let eventsList = ''; 
    
            // Itera sobre todos os eventos no banco de dados e formata suas informações
            for (let i = 0; i < eventsDatabase.length; i++) {
                eventsList += `Evento ${i+1}: ${eventsDatabase[i].title}\n` +
                            `Descrição: ${eventsDatabase[i].desc}\n` +
                            `Data: ${eventsDatabase[i].date} ${eventsDatabase[i].hour}\n\n`;
            }
        
            res.statusCode = 200; 
            res.send(eventsList); 
        }
        
    }
    
    // Define a rota para deletar um evento pelo índice fornecido
    export const deleteEventsRoute: RequestHandler = (req: Request, res: Response) => {
        const index = Number(req.get('index')) - 1; // Obtém o índice do evento a ser deletado (ajustado para base 0)
    
        if (!isNaN(index) && index >= 0 && index < eventsDatabase.length) { 
            const deletedEvent = eventsDatabase.splice(index, 1); // Remove o evento do banco de dados
            res.statusCode = 200; 
            res.send(`Evento "${deletedEvent[0].title}" deletado com sucesso.`); // Envia a resposta confirmando a exclusão
        } 
        
        else {
            res.statusCode = 400; 
            res.send("Índice inválido ou fora do alcance."); 
        }
    }

}

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
//FAZER as funções que faltam dos eventos aqui




//--------------------------Wallet a partir daqui ---------------------
// Criar o objeto wallet
export type Wallet = {
    email: string;
    balance: number;
    transactionHistory: { tipo: 'credito' | 'apostar' | 'saque' | 'pix' | 'bank', amount: number, data: string }[];
};

let walletsDatabase: Wallet[] = [];

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

// Rota para adicionar fundos à carteira do usuário
export const addFundsToWalletRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEmail = req.get('email');
    const pAmount = Number(req.get('amount'));
    const pTransferType = req.get('transferType'); // Tipo de transferência: 'pix' ou 'bank'

    if (pEmail && !isNaN(pAmount) && pAmount > 0 && pTransferType) {
        let wallet = await findWallet(pEmail);
        if (!wallet) {
            wallet = await createWallet(pEmail);
        }

        wallet.balance += pAmount;

        // Conecta ao banco de dados
        let connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        // Atualiza o saldo no banco de dados
        await connection.execute(
            'UPDATE WALLETS SET balance = :balance WHERE email = :email',
            [wallet.balance, pEmail],
            { autoCommit: true }
        );

        // Adiciona a transação ao histórico de transações
        await connection.execute(
            'INSERT INTO TRANSACTIONS (email, type, amount, date) VALUES (:email, :type, :amount, SYSDATE)',
            [pEmail, pTransferType, pAmount],
            { autoCommit: true }
        );

        await connection.close();

        res.status(200).send(`Fundos adicionados com sucesso via ${pTransferType}. Saldo atual: R$${wallet.balance}`);
    } else {
        res.status(400).send("Parâmetros inválidos ou faltantes.");
    }
};

// Rota para sacar fundos da carteira do usuário
export const withdrawFundsRoute: RequestHandler = async (req: Request, res: Response) => {
    const pEmail = req.get('email');
    const pAmount = Number(req.get('amount'));
    const pBankDetails = req.get('bankDetails'); // Detalhes bancários para o saque

    if (pEmail && !isNaN(pAmount) && pAmount > 0 && pBankDetails) {
        let wallet = await findWallet(pEmail);
        if (wallet) {
            // Verifica se a carteira tem saldo suficiente
            if (wallet.balance >= pAmount) {
                wallet.balance -= pAmount;

                let connection = await OracleDB.getConnection({
                    user: process.env.ORACLE_USER,
                    password: process.env.ORACLE_PASSWORD,
                    connectString: process.env.ORACLE_CONN_STR
                });

                // Atualiza o saldo da carteira no banco de dados
                await connection.execute(
                    'UPDATE WALLETS SET balance = :balance WHERE email = :email',
                    [wallet.balance, pEmail],
                    { autoCommit: true }
                );

                // Registra a transação de saque
                await connection.execute(
                    'INSERT INTO TRANSACTIONS (email, type, amount, date) VALUES (:email, :type, :amount, SYSDATE)',
                    [pEmail, 'saque', pAmount],
                    { autoCommit: true }
                );

                await connection.close();

                res.status(200).send(`Saque de R$${pAmount} realizado com sucesso. Saldo atual: R$${wallet.balance}`);
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