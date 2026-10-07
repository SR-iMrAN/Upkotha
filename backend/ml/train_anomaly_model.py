"""
UPKOTHA (উপকথা) - Isolation Forest Anomaly Detection Training Script

Generates realistic synthetic Bangladeshi MFS transaction records and trains
a scikit-learn IsolationForest model to evaluate unsupervised anomaly detection.

Features:
- transaction_amount
- hour_of_day
- day_of_week
- recipient_is_new
- recipient_frequency
- daily_transaction_count
- daily_transaction_total
- user_average_transaction_amount
- user_transaction_std
- time_since_previous_transaction
- historical_behavior_deviation (z-score)
"""

import numpy as np
import json
import os

def generate_synthetic_data(normal_n=2000, anomaly_n=100, seed=42):
    np.random.seed(seed)
    
    # 1. Normal Transactions
    # User normally sends ৳200, ৳500, ৳350, ৳700, ৳450 during day hours (9am - 9pm)
    normal_amounts = np.random.normal(loc=450, scale=160, size=normal_n)
    normal_amounts = np.clip(normal_amounts, 50, 1500)
    
    normal_hours = np.random.randint(8, 22, size=normal_n)
    normal_days = np.random.randint(0, 7, size=normal_n)
    normal_recipient_new = np.random.choice([0, 1], p=[0.88, 0.12], size=normal_n)
    normal_recipient_freq = np.where(normal_recipient_new == 1, 0, np.random.randint(3, 30, size=normal_n))
    normal_daily_count = np.random.randint(1, 5, size=normal_n)
    normal_daily_total = normal_amounts + np.random.randint(0, 1000, size=normal_n)
    normal_user_avg = np.full(normal_n, 450.0)
    normal_user_std = np.full(normal_n, 160.0)
    normal_time_since_prev = np.random.uniform(2.0, 48.0, size=normal_n)
    normal_z_scores = np.abs(normal_amounts - normal_user_avg) / normal_user_std
    
    X_normal = np.column_stack([
        normal_amounts,
        normal_hours,
        normal_days,
        normal_recipient_new,
        normal_recipient_freq,
        normal_daily_count,
        normal_daily_total,
        normal_user_avg,
        normal_user_std,
        normal_time_since_prev,
        normal_z_scores,
    ])
    y_normal = np.zeros(normal_n)  # 0 = Normal
    
    # 2. Anomalous Transactions (Unusual midnight drains, ৳15,000 spikes to new recipients)
    # E.g. ৳15,000 to a new recipient at 2:47 AM
    anomaly_amounts = np.random.uniform(10000, 25000, size=anomaly_n)
    anomaly_hours = np.random.choice([0, 1, 2, 3, 4], size=anomaly_n)
    anomaly_days = np.random.randint(0, 7, size=anomaly_n)
    anomaly_recipient_new = np.ones(anomaly_n)  # 1 = New recipient
    anomaly_recipient_freq = np.zeros(anomaly_n)
    anomaly_daily_count = np.random.randint(5, 12, size=anomaly_n)
    anomaly_daily_total = anomaly_amounts + 6000
    anomaly_user_avg = np.full(anomaly_n, 450.0)
    anomaly_user_std = np.full(anomaly_n, 160.0)
    anomaly_time_since_prev = np.random.uniform(0.01, 0.2, size=anomaly_n)  # Rapid drain
    anomaly_z_scores = (anomaly_amounts - anomaly_user_avg) / anomaly_user_std
    
    X_anomaly = np.column_stack([
        anomaly_amounts,
        anomaly_hours,
        anomaly_days,
        anomaly_recipient_new,
        anomaly_recipient_freq,
        anomaly_daily_count,
        anomaly_daily_total,
        anomaly_user_avg,
        anomaly_user_std,
        anomaly_time_since_prev,
        anomaly_z_scores,
    ])
    y_anomaly = np.ones(anomaly_n)  # 1 = Anomaly
    
    X = np.vstack([X_normal, X_anomaly])
    y = np.concatenate([y_normal, y_anomaly])
    
    return X, y

def evaluate_scikit_isolation_forest():
    try:
        from sklearn.ensemble import IsolationForest
        from sklearn.metrics import roc_auc_score, precision_recall_fscore_support
    except ImportError:
        print("Note: scikit-learn is not installed in the current environment. Returning schema specification.")
        return

    X, y = generate_synthetic_data()
    contamination = 100 / 2100  # ~4.7%
    
    iso_forest = IsolationForest(
        n_estimators=100,
        max_samples=256,
        contamination=contamination,
        random_state=42
    )
    
    iso_forest.fit(X)
    
    # Decision function returns negative anomaly scores (lower = more anomalous)
    scores = -iso_forest.decision_function(X)
    auc = roc_auc_score(y, scores)
    print(f"[UPKOTHA ML] Isolation Forest ROC-AUC on synthetic dataset: {auc:.4f}")
    
    # Test specific benchmark cases:
    # 1. Normal: ৳500 at 2 PM to familiar contact
    test_normal = np.array([[500, 14, 2, 0, 12, 2, 1200, 450, 160, 6.0, 0.31]])
    score_normal = -iso_forest.decision_function(test_normal)[0]
    
    # 2. High Risk: ৳15,000 at 2:47 AM to new recipient
    test_anomaly = np.array([[15000, 2, 2, 1, 0, 5, 17000, 450, 160, 0.05, 90.9]])
    score_anomaly = -iso_forest.decision_function(test_anomaly)[0]
    
    print(f"Normal Case (500 BDT, 2 PM, familiar contact) raw score: {score_normal:.4f}")
    print(f"Anomaly Case (15,000 BDT, 2:47 AM, new contact) raw score: {score_anomaly:.4f}")

if __name__ == '__main__':
    print("UPKOTHA MFS Anomaly Detection Synthetic Pipeline initialized.")
    evaluate_scikit_isolation_forest()
