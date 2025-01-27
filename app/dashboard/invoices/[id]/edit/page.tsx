import Form from '@/app/ui/invoices/edit-form'
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs"
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data'

export default async function Page( { params} : {params: Promise<{id : string}> }) {
    const pathParams = await params;
    const id = pathParams.id;
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ])
    
    return (
        <main>
            <Breadcrumbs breadcrumbs={[
                { label: "Invoices", href:"/dashboard/invoices"},
                { label: 'Edit Invoice', href: `dashboard/invoices/edit/${id}/edit`, active: true}
            ]} />
            <Form invoice={invoice} customers={customers}/>
        </main>
    )
}