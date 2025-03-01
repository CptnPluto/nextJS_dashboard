"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcrypt";

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: "Please select a cusomter.",
	}),
	amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0." }),
	status: z.enum(["pending", "paid"], { invalid_type_error: "Please select an invoice status." }),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const EditInvoice = FormSchema.omit({ date: true });
const DeleteInvoice = FormSchema.omit({ customerId: true, amount: true, status: true, date: true });
const UserSignup = z
	.object({
		name: z.string().min(2, { message: "Name must be 2 or more characters long." }),
		email: z.string().email({ message: "Invalid email address." }),
		password: z.string().min(6, { message: "Password must be 5 or more characters long." }),
		passwordConf: z.string().min(6, { message: "Password must be 5 or more characters long." }),
	})
	// .required()
	.refine((data) => data.password === data.passwordConf, {
		message: "Passwords don't match",
		path: ["passwordConf"],
	});

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};

export type SignupState = {
	errors?: {
		name?: string[];
		email?: string[];
		password?: string[];
		passwordConf?: string[];
		status?: string[];
	};
	message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing fields. Failed to create invoice.",
		};
	}

	const { customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];

	try {
		await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
	} catch (error: any) {
		return { message: "Failed to insert data into db: ", error: error };
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function editInvoice(invoiceId: string, prevState: State, formData: FormData): Promise<State>  {
	const validatedFields = EditInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
		id: invoiceId,
	});

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing fields. Failed to update invoice.",
		};
	}

	const { customerId, amount, status, id } = validatedFields.data;
	const amountInCents = amount * 100;

	try {
		await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id=${id}
        `;
	} catch (error: any) {
		return { message: "Database Error: Failed to update invoice", errors: error };
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(invoiceId: string) {
	try {
		const { id } = DeleteInvoice.parse({
			id: invoiceId,
		});

		await sql`
        DELETE FROM invoices WHERE id = ${id}
        `;
	} catch (error: any) {
		console.log("Error deleting invoice: ", error.message);
		throw error;
	}

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
	try {
		await signIn("credentials", formData);
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					console.log("Credentials: ", formData);
					return "Invalid credentials.";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}
}

export async function signup(previousState: SignupState, formData: FormData): Promise<SignupState> {
	const validatedFields = UserSignup.safeParse({
		name: formData.get("name"),
		email: formData.get("email"),
		password: formData.get("password"),
		passwordConf: formData.get("passwordConf"),
	});

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing fields. Failed to sign up.",
		};
	}

	const { name, email, password } = validatedFields.data;

	try {
		const saltRounds = 10;
		bcrypt.hash(password, saltRounds).then(async function (hash) {
		await sql`
        INSERT INTO users (name, email, password)
        VALUES (${name}, ${email}, ${hash})
    `;
		});
	} catch (error: any) {
		return {
			errors: {
				status: [error.message ?? "Unknown DB error"],
			},
			message: "Failed to insert data into db: ",
		};
	}
	redirect("/login");
}
