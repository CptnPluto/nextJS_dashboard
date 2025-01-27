"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(["pending", "paid"]),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const EditInvoice = FormSchema.omit({ date: true })
const DeleteInvoice = FormSchema.omit({ customerId: true, amount: true, status: true, date: true})

export async function createInvoice(formData: FormData) {
	try {
		const { customerId, amount, status } = CreateInvoice.parse({
			...Object.fromEntries(formData),
		});
		const amountInCents = amount * 100;
		const date = new Date().toISOString().split("T")[0];

		const res = await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
	} catch (error: any) {
		console.error("Failed to create invoice:", error);
		throw new Error("Failed to create invoice: " + error.message);
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function editInvoice(invoiceId: string, formData: FormData) {
    try {
        const { customerId, amount, status, id } = EditInvoice.parse({
            ...Object.fromEntries(formData),
            id: invoiceId,
        })
        const amountInCents = amount * 100;

        const res = await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id=${id}
        `;

    } catch (error: any) {
        console.error("Failed to edit invoice: ", error.message);
    }
    
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(invoiceId: string) {
    try {
        const { id } = DeleteInvoice.parse({
            id: invoiceId
        })

        const res = await sql`
        DELETE FROM invoices WHERE id = ${id}
        `;
    } catch (error: any) {
        console.log("Error deleting invoice: ", error.message);
    }
    
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}