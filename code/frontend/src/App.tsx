import { useEffect, useState } from "react";
import ComplaintStep1 from "./pages/ComplaintStep1";
import ComplaintStep2 from "./pages/ComplaintStep2";
import ComplaintStep3 from "./pages/ComplaintStep3";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [currentStep]);

  switch (currentStep) {
    case 1:
      return <ComplaintStep1 onNext={() => setCurrentStep(2)} />;
    case 2:
      return (
        <ComplaintStep2
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      );
    case 3:
      return <ComplaintStep3 onBack={() => setCurrentStep(2)} />;
    default:
      return <ComplaintStep1 onNext={() => setCurrentStep(2)} />;
  }
}

export default App;
