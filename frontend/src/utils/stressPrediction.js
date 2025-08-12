// Fonction pour convertir le niveau de stress en valeur numérique
const stressToNumber = (stress) => {
  switch (stress) {
    case 'Faible': return 20;
    case 'Modéré': return 50;
    case 'Élevé': return 80;
    default: return 0;
  }
};

// Fonction pour calculer la moyenne mobile
const calculateMovingAverage = (data, windowSize = 3) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const sum = window.reduce((acc, val) => acc + val, 0);
    result.push(sum / window.length);
  }
  return result;
};

// Fonction pour calculer la régression linéaire
const linearRegression = (x, y) => {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

// Fonction pour détecter les anomalies
const detectAnomalies = (stressValues) => {
  const mean = stressValues.reduce((a, b) => a + b, 0) / stressValues.length;
  const stdDev = Math.sqrt(
    stressValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / stressValues.length
  );
  
  const anomalies = stressValues.map((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    return {
      index,
      value,
      isAnomaly: zScore > 2, // Valeur considérée comme anormale si z-score > 2
      severity: zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low'
    };
  }).filter(a => a.isAnomaly);

  return anomalies;
};

// Fonction pour classifier les patterns de stress
const classifyStressPattern = (stressValues) => {
  if (stressValues.length < 3) return 'insufficient_data';

  // Calculer les variations
  const variations = [];
  for (let i = 1; i < stressValues.length; i++) {
    variations.push(stressValues[i] - stressValues[i - 1]);
  }

  // Calculer les statistiques
  const meanVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
  const maxVariation = Math.max(...variations);
  const minVariation = Math.min(...variations);
  const currentTrend = stressValues[stressValues.length - 1] - stressValues[0];

  // Classifier le pattern
  if (maxVariation > 30 && minVariation < -30) {
    return 'volatile';
  } else if (currentTrend > 20) {
    return 'increasing';
  } else if (currentTrend < -20) {
    return 'decreasing';
  } else if (Math.abs(meanVariation) < 10) {
    return 'stable';
  } else if (variations.some(v => v > 20) && variations.some(v => v < -20)) {
    return 'fluctuating';
  } else {
    return 'moderate';
  }
};

// Fonction pour obtenir les recommandations basées sur le pattern
const getPatternRecommendations = (pattern) => {
  const recommendations = {
    volatile: {
      title: 'Pattern Volatile',
      description: 'Niveau de stress très variable',
      advice: 'Recommandation : Techniques de stabilisation émotionnelle et suivi régulier'
    },
    increasing: {
      title: 'Tendance à la Hausse',
      description: 'Niveau de stress en augmentation constante',
      advice: 'Recommandation : Intervention préventive et techniques de relaxation'
    },
    decreasing: {
      title: 'Tendance à la Baisse',
      description: 'Niveau de stress en diminution',
      advice: 'Recommandation : Maintenir les bonnes pratiques actuelles'
    },
    stable: {
      title: 'Pattern Stable',
      description: 'Niveau de stress constant',
      advice: 'Recommandation : Continuer le suivi régulier'
    },
    fluctuating: {
      title: 'Pattern Fluctuant',
      description: 'Variations modérées du stress',
      advice: 'Recommandation : Exercices de respiration et gestion du stress'
    },
    moderate: {
      title: 'Pattern Modéré',
      description: 'Variations normales du stress',
      advice: 'Recommandation : Maintenir les activités de bien-être'
    },
    insufficient_data: {
      title: 'Données Insuffisantes',
      description: 'Plus de données nécessaires pour l\'analyse',
      advice: 'Recommandation : Continuer la collecte de données'
    }
  };

  return recommendations[pattern];
};

// Fonction pour obtenir des conseils pratiques selon le pattern
const getPracticalAdvice = (pattern) => {
  switch (pattern) {
    case 'increasing':
      return [
        { type: 'warning', message: 'Essayez des exercices de relaxation chaque soir.' },
        { type: 'info', message: 'Parlez de vos ressentis à un adulte de confiance.' },
        { type: 'info', message: 'Pratiquez une activité physique régulière.' }
      ];
    case 'volatile':
      return [
        { type: 'info', message: 'Tenez un journal de stress pour identifier les déclencheurs.' },
        { type: 'info', message: 'Essayez la méditation ou la cohérence cardiaque.' }
      ];
    case 'decreasing':
      return [
        { type: 'success', message: 'Continuez vos bonnes pratiques actuelles.' },
        { type: 'info', message: 'Partagez vos méthodes de gestion du stress avec vos proches.' }
      ];
    case 'stable':
      return [
        { type: 'info', message: 'Maintenez votre routine de bien-être.' },
        { type: 'info', message: 'Restez attentif à tout changement.' }
      ];
    case 'fluctuating':
      return [
        { type: 'info', message: 'Essayez de structurer vos journées pour plus de régularité.' },
        { type: 'info', message: 'Identifiez les moments où le stress augmente et adaptez vos activités.' }
      ];
    case 'moderate':
      return [
        { type: 'info', message: 'Continuez à surveiller votre niveau de stress.' }
      ];
    case 'insufficient_data':
    default:
      return [
        { type: 'secondary', message: 'Collectez plus de données pour obtenir des conseils personnalisés.' }
      ];
  }
};

// Fonction principale de prédiction
export const predictStressLevel = (history) => {
  if (!history || history.length < 3) {
    return {
      predictedStress: 50,
      trend: '→',
      confidence: 50,
      pattern: 'insufficient_data',
      anomalies: [],
      recommendations: getPatternRecommendations('insufficient_data'),
      advice: getPracticalAdvice('insufficient_data')
    };
  }

  // Convertir l'historique en valeurs numériques
  const stressValues = history.map(h => stressToNumber(h.stress));
  
  // Calculer la moyenne mobile
  const movingAverages = calculateMovingAverage(stressValues);
  
  // Préparer les données pour la régression
  const x = Array.from({ length: movingAverages.length }, (_, i) => i);
  const y = movingAverages;
  
  // Calculer la régression linéaire
  const { slope, intercept } = linearRegression(x, y);
  
  // Prédire la prochaine valeur
  const nextX = x.length;
  const predictedValue = Math.round(slope * nextX + intercept);
  
  // Limiter la prédiction entre 0 et 100
  const predictedStress = Math.max(0, Math.min(100, predictedValue));
  
  // Déterminer la tendance
  let trend = '→';
  if (slope > 2) trend = '↑';
  else if (slope < -2) trend = '↓';
  
  // Calculer la confiance
  const rSquared = calculateRSquared(x, y, slope, intercept);
  const confidence = Math.round(rSquared * 100);

  // Détecter les anomalies
  const anomalies = detectAnomalies(stressValues);

  // Classifier le pattern
  const pattern = classifyStressPattern(stressValues);
  const recommendations = getPatternRecommendations(pattern);
  
  return {
    predictedStress,
    trend,
    confidence: Math.max(confidence, 50),
    pattern,
    anomalies,
    recommendations,
    advice: getPracticalAdvice(pattern)
  };
};

// Fonction pour calculer le R² (coefficient de détermination)
const calculateRSquared = (x, y, slope, intercept) => {
  const n = x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  
  let ssRes = 0; // Somme des carrés des résidus
  let ssTot = 0; // Somme totale des carrés
  
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += Math.pow(y[i] - yPred, 2);
    ssTot += Math.pow(y[i] - yMean, 2);
  }
  
  return 1 - (ssRes / ssTot);
}; 