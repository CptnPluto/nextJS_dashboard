"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
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
		return {message: "Failed to insert data into db: ", error: error};
	}
    
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function editInvoice(invoiceId: string, formData: FormData) {
	try {
		const { customerId, amount, status, id } = EditInvoice.parse({
			...Object.fromEntries(formData),
			id: invoiceId,
		});
		const amountInCents = amount * 100;

		await sql`
        UPDATE invoicess
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id=${id}
        `;
	} catch (error: any) {
		console.error("Failed to edit invoice: ", error.message);
		throw error;
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
