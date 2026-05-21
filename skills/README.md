# AI-Quantitative Platform: Skills & Agents

This directory contains specialized skills and agents designed to enhance the AI-Quantitative Platform with expert guidance and automated workflows for quantitative trading, analysis, and deployment.

## Skills Organization

### 📊 Trading & Analysis Skills
- `backtest-strategy` - Backtesting engine and performance evaluation
- `signal-validation` - Validate and verify trading signals
- `portfolio-optimization` - Portfolio allocation and risk management
- `market-analysis` - Deep market and technical analysis
- `risk-assessment` - Comprehensive risk evaluation

### 🔧 Infrastructure & DevOps
- `docker-deployment` - Docker containerization and deployment
- `kubernetes` - Kubernetes orchestration knowledge
- `redis-optimization` - Redis caching and queue optimization
- `api-security` - API security hardening
- `monitoring-alerts` - System monitoring and alerting setup

### 🧪 Quality & Testing
- `testing-framework` - Unit and integration testing
- `code-review` - Code review and quality assurance
- `performance-profiling` - Performance optimization
- `debugging-tools` - Debugging and troubleshooting

### 📖 Documentation & Knowledge
- `api-documentation` - API documentation generation
- `system-architecture` - Architecture decision records
- `onboarding` - System onboarding guides

## Usage

Each skill can be invoked to provide expert guidance on specific tasks related to quantitative trading systems.

Example:
```bash
# Use a skill for backtesting analysis
claude /backtest-strategy
```

## Skill Format

Each skill is a markdown file with:
- YAML frontmatter with metadata
- Detailed instructions and best practices
- Example use cases
- Related commands/tools

## Contributing

To add a new skill:
1. Create a new `.md` file in this directory
2. Follow the standard skill format
3. Include clear instructions and examples
4. Test with real use cases
