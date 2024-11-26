import { Request, RequestHandler, Response } from "express"; 
import OracleDB from "oracledb"; 
import dotenv from 'dotenv'; 
import { resolve } from 'path'; 

dotenv.config({ path: resolve('C:/workspace/outros/.env') });

export namespace AccountsHandler {

    async function connectOracle() {
        try {
            const connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR,
            });
            return connection;
        } 
        catch (error) {
            console.error('Não foi possível conectar ao Oracle Database:', error);
        }
    }

    export type UserAccount = {
        name: string; 
        email: string; 
        password: string; 
    };

    async function login(email: string, password: string): Promise<string | undefined> {
        const connection:any = await connectOracle();
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        try {
            const result = await connection.execute(
                'SELECT TOKEN FROM ACCOUNTS WHERE EMAIL = :email AND PASSWORD_ = :password',
                [email, password]
            );

            if (result.rows && result.rows.length > 0) {
                return result.rows[0].TOKEN;
            }
            return undefined;
        } 
        catch (error) {
            console.error('Erro ao realizar login:', error);
            return undefined;
        }
        finally {
            await connection.close();
        }
    }

    export const loginRoute: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email'); 
        const pPassword = req.get('password'); 

        if (pEmail && pPassword) {
            const token = await login(pEmail, pPassword);

            if (token) {
                res.status(200).send(`Login realizado. Token: ${token}`);
            } 
            else {
                res.status(401).send('Credenciais inválidas.');
            }
        } else {
            res.status(400).send('Requisição inválida - Parâmetros faltando.');
        }
    }

    export async function verifyEmail(email: string): Promise<boolean> {
        const connection:any = await connectOracle();
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        try {
            const result = await connection.execute(
                'SELECT EMAIL FROM ACCOUNTS WHERE EMAIL = :email',
                [email]
            );

            await connection.close();

            return (result.rows && result.rows.length === 0);
        } 
        catch (error) {
            console.error('Erro ao verificar e-mail:', error);
            await connection.close();
            return false;
        }
    }

    
    export const createAccountRoute: RequestHandler = async (req: Request, res: Response) => {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pUser = "user";
        const pBirthdate = req.get('birthdate');

        if (pName && pEmail && pPassword && pBirthdate) {
            const user_year = Number(pBirthdate.substring(0, 4)); // Ano
            const user_month = Number(pBirthdate.substring(5, 7)); // Mês
            const user_day = Number(pBirthdate.substring(8, 10)); // Dia
            
            console.log(user_year);
            console.log(user_month);
            console.log(user_day);
            
            const today = new Date();
            const today_year = today.getFullYear();
            const today_month = today.getMonth() + 1; // Mes atual (0-indexed, então somamos 1)
            const today_day = today.getDate(); // Dia atual
            
            const today_date = today_year + "-" + String(today_month).padStart(2, '0') + "-" + String(today_day).padStart(2, '0');
            console.log(today_date);
            
            // Calculando a idade
            let age = today_year - user_year;
            
            // Verificando se o aniversário já passou no ano atual
            if (today_month < user_month || (today_month === user_month && today_day < user_day)) {
                age -= 1; // Subtrai 1 se o aniversário ainda não ocorreu
            }
            
            console.log("Idade do usuário:", age);
            
            // Verifica se o usuário tem menos de 18 anos
            if (age < 18) {
                res.status(403).send("Usuário deve ter pelo menos 18 anos.");
                return;
            }

            const birthDate = new Date(pBirthdate);

            const emailAvailable = await verifyEmail(pEmail);

            if (emailAvailable) {
                const connection: any = await connectOracle();
                OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

                try {
                    await connection.execute(
                        "INSERT INTO ACCOUNTS VALUES (SEQ_ACCOUNTS.nextval, :name, :email, :password, :user_type, dbms_random.string('x',32), :birthdate)",
                        { name: pName, email: pEmail, password: pPassword, user_type: pUser, birthdate: birthDate },
                        { autoCommit: true }
                    );

                    await connection.execute(
                        "INSERT INTO WALLETS (USER_ID, BALANCE) VALUES (SEQ_ACCOUNTS.CURRVAL, 0)",
                        [],
                        { autoCommit: true }
                    );

                    res.status(201).send('Nova conta adicionada');
                } 
                catch (error) {
                    console.error('Erro ao criar conta:', error);
                    res.status(500).send("Erro ao criar conta.");
                } 
                finally {
                    await connection.close();
                }
            } 
            else {
                res.status(409).send("E-mail já cadastrado.");
            }
        } 
        else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    }
}