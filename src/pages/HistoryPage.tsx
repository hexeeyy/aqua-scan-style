import { ScanHistory } from "@/components/ScanHistory";
import { useNavigate } from "react-router-dom";

const HistoryPage = () => {
  const navigate = useNavigate();
  return <ScanHistory onBack={() => navigate("/")} />;
};

export default HistoryPage;
