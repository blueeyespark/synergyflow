import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

export default function BudgetCalculator({ open, onOpenChange }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result;

      switch (operation) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = currentValue / inputValue;
          break;
        case "%":
          result = currentValue % inputValue;
          break;
        default:
          result = inputValue;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result;

    switch (operation) {
      case "+":
        result = previousValue + inputValue;
        break;
      case "-":
        result = previousValue - inputValue;
        break;
      case "×":
        result = previousValue * inputValue;
        break;
      case "÷":
        result = previousValue / inputValue;
        break;
      case "%":
        result = previousValue % inputValue;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const buttons = [
    { label: "C", action: clear, className: "bg-slate-200 text-slate-700" },
    { label: "±", action: () => setDisplay(String(-parseFloat(display))), className: "bg-slate-200 text-slate-700" },
    { label: "%", action: () => performOperation("%"), className: "bg-slate-200 text-slate-700" },
    { label: "÷", action: () => performOperation("÷"), className: "bg-indigo-500 text-white" },
    { label: "7", action: () => inputDigit("7") },
    { label: "8", action: () => inputDigit("8") },
    { label: "9", action: () => inputDigit("9") },
    { label: "×", action: () => performOperation("×"), className: "bg-indigo-500 text-white" },
    { label: "4", action: () => inputDigit("4") },
    { label: "5", action: () => inputDigit("5") },
    { label: "6", action: () => inputDigit("6") },
    { label: "-", action: () => performOperation("-"), className: "bg-indigo-500 text-white" },
    { label: "1", action: () => inputDigit("1") },
    { label: "2", action: () => inputDigit("2") },
    { label: "3", action: () => inputDigit("3") },
    { label: "+", action: () => performOperation("+"), className: "bg-indigo-500 text-white" },
    { label: "0", action: () => inputDigit("0"), className: "col-span-2" },
    { label: ".", action: inputDecimal },
    { label: "=", action: calculate, className: "bg-indigo-600 text-white" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <p className="text-right text-3xl font-mono text-white truncate">
              {display}
            </p>
            {operation && (
              <p className="text-right text-sm text-slate-400">
                {previousValue} {operation}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((btn, i) => (
              <Button
                key={i}
                variant="outline"
                className={`h-12 text-lg font-medium ${btn.className || ''}`}
                onClick={btn.action}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}