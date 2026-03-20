import { ScanHistory } from "@/components/ScanHistory";
import { useNavigate } from "react-router-dom";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { MockDataBanner } from "@/components/MockDataBanner";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { isApproved, isLoading } = useApprovalStatus();

  return (
    <ScanHistory
      onBack={() => navigate("/")}
      mockMode={!isLoading && !isApproved}
    />
  );
};

export default HistoryPage;
