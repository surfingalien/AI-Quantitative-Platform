# models/quant.py
# Attention-based Transformer for financial time-series forecasting.
# Predicts next-day trend direction (Up/Down) and volatility regime.

import torch
import torch.nn as nn


class QuantTransformer(nn.Module):
    """
    Multi-task Transformer for financial time-series.

    Input:  (batch, seq_len, input_dim)  — OHLCV + technical indicators
    Output: (trend_logits, volatility_pred)
              trend_logits  : (batch, 2)  — class 0 = Bearish, 1 = Bullish
              volatility_pred: (batch, 1) — predicted 20-day rolling std
    """

    def __init__(
        self,
        input_dim: int = 8,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.input_proj = nn.Linear(input_dim, d_model)

        # Learned positional encoding (supports up to 1000 time steps)
        self.pos_encoder = nn.Parameter(torch.zeros(1, 1000, d_model))

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, batch_first=True, dropout=dropout
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        self.dropout = nn.Dropout(dropout)

        # Task heads
        self.trend_head = nn.Linear(d_model, 2)       # Bearish / Bullish
        self.volatility_head = nn.Linear(d_model, 1)  # Regression

    def forward(self, x: torch.Tensor):
        x = self.input_proj(x)
        x = x + self.pos_encoder[:, : x.size(1), :]
        x = self.transformer(x)
        x = self.dropout(x[:, -1, :])  # Last time-step representation

        return self.trend_head(x), self.volatility_head(x)

    # ------------------------------------------------------------------
    # Convenience: single-task classifier variant used in the API
    # ------------------------------------------------------------------
    @classmethod
    def classifier(cls, **kwargs) -> "QuantTransformer":
        """Returns model configured for trend classification only."""
        return cls(**kwargs)
