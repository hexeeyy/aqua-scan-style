import { ScanHistory } from "@/components/ScanHistory";
import { useNavigate } from "react-router-dom";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { ApprovalGate } from "@/components/ApprovalGate";
import { useState, useEffect } from "react";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { isApproved, isLoading } = useApprovalStatus();
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (!isLoading && !isApproved) {
      setShowGate(true);
    }
  }, [isLoading, isApproved]);

  return (
    <>
      <ApprovalGate
        open={showGate}
        onOpenChange={(open) => {
          setShowGate(open);
          if (!open) navigate("/");
        }}
      />
      {isApproved ? (
        <ScanHistory onBack={() => navigate("/")} />
      ) : null}
    </>
  );
};

export default HistoryPage;
