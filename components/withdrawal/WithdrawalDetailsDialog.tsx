import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  CreditCard,
  Wallet,
  Mail,
  Phone,
  Clock,
  Banknote,
  User,
  Users,
  Gauge,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WithdrawalDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: {
    name: string;
    email: string;
    phone: string;
    amount: string | number;
    status: string;
    createdAt: string;
    walletId: string;
    chain: string;
    transactionId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  } | null;
}

export function WithdrawalDetailsDialog({
  isOpen,
  onOpenChange,
  withdrawal,
}: WithdrawalDetailsDialogProps) {
  if (!withdrawal) return null;

  const bankdetails = [
    {
      label: "Account Number",
      value: withdrawal.accountNumber,
    },
    {
      label: "IFSC Code",
      value: withdrawal.ifscCode,
    },
    {
      label: "Account Holder Name",
      value: withdrawal.accountHolderName,
    },
  ];
  const cryptodetails = [
    { label: "Wallet ID", value: withdrawal.walletId, fullWidth: true },
    { label: "Chain", value: withdrawal.chain, fullWidth: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl ">
        <div className="space-y-6">
          {/* Withdrawal Details Card */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-[#e9ecff] border-b border-gray-200">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-white rounded-full border border-gray-300">
                  {withdrawal.accountHolderName ? (
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Wallet className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <span className="font-bold text-gray-900">
                  {withdrawal.accountHolderName
                    ? "Bank Account Details"
                    : "Crypto Wallet Details"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {(withdrawal.accountHolderName
                  ? bankdetails
                  : cryptodetails
                ).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-gray-700">
                        {item.label}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 break-all text-right">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
