import React from "react";
import { useSelector } from "react-redux";
import ReportComponents from "../components/ReportComponents";
import { salesReport } from "../slice/orderSlice";

export default function SalesReportPage() {
    const { saleReport, saleReplaceReport, saleReturnReport, loading } = useSelector((state) => state.order);

    return (
        <ReportComponents
            title="Sales Report"
            reportData={saleReport}
            replaceReportData={saleReplaceReport}
            returnReportData={saleReturnReport}
            loading={loading}
            queryAction={salesReport}
        />
    );
}
