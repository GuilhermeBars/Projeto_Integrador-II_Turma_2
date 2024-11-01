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

        if (pName && pEmail && pPassword) {
            const emailAvailable = await verifyEmail(pEmail);

            if (emailAvailable) {
                const connection:any = await connectOracle();
                OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

                try {
                    await connection.execute(
                        "INSERT INTO ACCOUNTS VALUES (SEQ_ACCOUNTS.nextval, :name, :email, :password, :user_type, dbms_random.string('x',32))",
                        { name: pName, email: pEmail, password: pPassword, user_type: pUser },
                    );                    

                    await connection.execute(
                        "INSERT INTO WALLET (EMAIL, BALANCE) VALUES (:email, 0)",
                        [pEmail],
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