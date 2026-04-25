import { useState, useEffect } from 'react';
import './AnimateIS20.css';

interface SlotState {
  id: string;
  layer: number;
  position: number;
  occupied: boolean;
  color: string;
  ripple: boolean;
  justPlaced: boolean;
}

const TOTAL_LAYERS = 7;
const SLOTS_PER_LAYER = 6;
const TOTAL_SLOTS = TOTAL_LAYERS * SLOTS_PER_LAYER;

// Layer labels
const LAYER_LABELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

// Vendor color
const VENDOR_COLOR = '#4d8ee8';

export default function AnimateIS20() {
  const [phase, setPhase] = useState<'idle' | 'walk' | 'place' | 'detect' | 'done'>('idle');
  const [operatorPos, setOperatorPos] = useState({ x: 0, y: 0 });
  const [occupiedCount, setOccupiedCount] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const [slots, setSlots] = useState<SlotState[]>(() =>
    Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
      id: `slot-${i}`,
      layer: Math.floor(i / SLOTS_PER_LAYER),
      position: i % SLOTS_PER_LAYER,
      occupied: false,
      color: '#ffffff',
      ripple: false,
      justPlaced: false,
    }))
  );
  const [showRipple, setShowRipple] = useState<number[]>([]);
  const [message, setMessage] = useState('等待操作員掃描...');

  const emptySlots = slots.filter(s => !s.occupied);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('walk');
      setMessage('移動到備料區...');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === 'walk') {
      const animTimer = setTimeout(() => {
        setOperatorPos({ x: 70, y: 50 });
        setTimeout(() => {
          setPhase('place');
          setMessage('選擇空位...');
        }, 800);
      }, 100);
      return () => clearTimeout(animTimer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'place' && emptySlots.length > 0) {
      const pickTimer = setTimeout(() => {
        setMessage('拿起物料...');
        setTimeout(() => {
          // Pick a random empty slot
          const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
          const slotIndex = slots.findIndex(s => s.id === randomSlot.id);
          
          const newSlots = [...slots];
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            occupied: true,
            color: VENDOR_COLOR,
            justPlaced: true,
          };
          setSlots(newSlots);
          setOccupiedCount(prev => prev + 1);
          setMessage(`放置於 ${LAYER_LABELS[randomSlot.layer]} 層 ${randomSlot.position + 1} 位置...`);

          setTimeout(() => {
            setPhase('detect');
          }, 500);
        }, 600);
      }, 100);
      return () => clearTimeout(pickTimer);
    }
  }, [phase, emptySlots, slots]);

  useEffect(() => {
    if (phase === 'detect') {
      const rippleIndex = slots.findIndex(s => s.justPlaced);
      if (rippleIndex >= 0) {
        setShowRipple([rippleIndex]);
        setMessage('系統自動感應識別位置...');
        
        setTimeout(() => {
          const newSlots = slots.map((s, i) => 
            i === rippleIndex ? { ...s, ripple: false, justPlaced: false } : s
          );
          setSlots(newSlots);
          setShowRipple([]);
          setPhase('done');
        }, 1200);
      }
    }
  }, [phase, slots]);

  useEffect(() => {
    if (phase === 'done') {
      const doneTimer = setTimeout(() => {
        if (cycleCount < 2) {
          setCycleCount(2);
          setMessage('等待下一個物料...');
          setTimeout(() => {
            setPhase('walk');
          }, 1500);
        } else {
          setMessage('所有物料上架完成！');
        }
      }, 1500);
      return () => clearTimeout(doneTimer);
    }
  }, [phase, cycleCount]);

  const getSlotClass = (slot: SlotState) => {
    let cls = 'slot';
    if (slot.occupied) cls += ' occupied';
    if (slot.justPlaced) cls += ' just-placed';
    if (slot.ripple) cls += ' ripple';
    return cls;
  };

  return (
    <div className="is20-container">
      <div className="is20-header">
        <h1>IS20 智能货架 - 自動感應上架動畫</h1>
        <div className="status-bar">
          <span className="status-item">📦 已上架: <strong>{occupiedCount}</strong> / {TOTAL_SLOTS}</span>
          <span className="status-item">🔄 循環: <strong>{cycleCount}</strong> / 2</span>
          <span className="status-item status-message">📋 {message}</span>
        </div>
      </div>

      <div className="is20-scene">
        {/* Operator */}
        <div 
          className="operator"
          style={{ 
            left: `${operatorPos.x}%`, 
            top: `${operatorPos.y}%`,
            opacity: phase === 'idle' || phase === 'done' ? 0 : 1
          }}
        >
          <div className="operator-body"></div>
          <div className="operator-head"></div>
          {phase === 'place' && <div className="material-pickup"></div>}
        </div>

        {/* Rack */}
        <div className="rack">
          {/* Top signal tower */}
          <div className="signal-tower">
            <div className="tower-base"></div>
            <div className={`tower-light ${occupiedCount > 0 ? 'active' : ''}`}></div>
          </div>

          {/* Layer labels */}
          <div className="layer-labels">
            {LAYER_LABELS.map(label => (
              <div key={label} className="layer-label">{label}</div>
            ))}
          </div>

          {/* Shelves */}
          <div className="shelves">
            {Array.from({ length: TOTAL_LAYERS }, (_, layerIdx) => (
              <div key={layerIdx} className="shelf">
                {/* Layer bar */}
                <div className="layer-bar">
                  <span className="layer-num">{LAYER_LABELS[layerIdx]}</span>
                </div>
                
                {/* Slots for this layer */}
                <div className="slots-row">
                  {slots
                    .filter(s => s.layer === layerIdx)
                    .sort((a, b) => a.position - b.position)
                    .map(slot => (
                      <div key={slot.id} className={getSlotClass(slot)}>
                        {slot.occupied ? (
                          <div className="material-roll" style={{ backgroundColor: slot.color }}>
                            <div className="roll-center"></div>
                          </div>
                        ) : (
                          <div className="empty-indicator">
                            <div className="led-white"></div>
                          </div>
                        )}
                        {slot.justPlaced && <div className="ripple-effect"></div>}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="progress-section">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${(occupiedCount / TOTAL_SLOTS) * 100}%` }}
            ></div>
          </div>
          <div className="progress-dots">
            {[1, 2].map(n => (
              <div 
                key={n} 
                className={`progress-dot ${cycleCount >= n ? 'active' : ''}`}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="is20-footer">
        <p>IS20 智能貨架系統 - 自動感應 · 無需指定位置 · LED 引導</p>
      </div>
    </div>
  );
}