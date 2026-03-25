"""Agent role catalog — 27 built-in roles with distinct personalities."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AgentRole:
    id: str
    name: str
    description: str
    vocabulary: str  # formal | casual | technical
    directness: str  # direct | diplomatic | blunt
    sentence_length: str  # short | medium | long


_ROLES: list[AgentRole] = [
    AgentRole("supervisor", "Supervisor", "Oversees the entire operation and makes final decisions", "formal", "direct", "medium"),
    AgentRole("project_sponsor", "Project Sponsor", "Provides strategic direction and resource allocation", "formal", "diplomatic", "long"),
    AgentRole("project_manager", "Project Manager", "Coordinates tasks, timelines, and deliverables", "formal", "direct", "medium"),
    AgentRole("tech_lead", "Tech Lead", "Makes technical architecture decisions", "technical", "direct", "medium"),
    AgentRole("coder", "Coder", "Writes and reviews code", "technical", "blunt", "short"),
    AgentRole("data_scientist", "Data Scientist", "Analyzes data and builds models", "technical", "diplomatic", "medium"),
    AgentRole("designer", "Designer", "Creates UI/UX designs and visual assets", "casual", "diplomatic", "medium"),
    AgentRole("devops", "DevOps Engineer", "Manages infrastructure and deployments", "technical", "direct", "short"),
    AgentRole("it_infrastructure", "IT Infrastructure", "Manages servers, networks, and security", "technical", "direct", "short"),
    AgentRole("qa_tester", "QA Tester", "Tests software and reports bugs", "technical", "blunt", "short"),
    AgentRole("security_auditor", "Security Auditor", "Audits code and infrastructure for vulnerabilities", "technical", "blunt", "medium"),
    AgentRole("reviewer", "Reviewer", "Reviews work quality and provides feedback", "formal", "diplomatic", "medium"),
    AgentRole("writer", "Writer", "Writes reports, docs, and communications", "casual", "diplomatic", "long"),
    AgentRole("translator", "Translator", "Translates content between languages", "formal", "diplomatic", "medium"),
    AgentRole("researcher", "Researcher", "Searches the web and gathers data", "technical", "direct", "medium"),
    AgentRole("document_reader", "Document Reader", "Reads and extracts info from documents", "technical", "direct", "short"),
    AgentRole("browser", "Browser Agent", "Navigates websites and extracts data", "technical", "direct", "short"),
    AgentRole("analyst", "Analyst", "Analyzes data and identifies patterns", "technical", "blunt", "medium"),
    AgentRole("finance", "Finance Analyst", "Handles financial analysis and budgeting", "formal", "direct", "medium"),
    AgentRole("legal", "Legal Advisor", "Reviews legal implications and compliance", "formal", "diplomatic", "long"),
    AgentRole("sales", "Sales Rep", "Handles outreach and deal closing", "casual", "direct", "short"),
    AgentRole("marketing", "Marketing Specialist", "Creates campaigns and content strategies", "casual", "diplomatic", "medium"),
    AgentRole("customer_support", "Customer Support", "Handles customer inquiries and issues", "casual", "diplomatic", "medium"),
    AgentRole("email_specialist", "Email Specialist", "Drafts and manages email communications", "formal", "diplomatic", "medium"),
    AgentRole("delivery", "Delivery Manager", "Ensures timely delivery of projects", "formal", "direct", "short"),
    AgentRole("product_manager", "Product Manager", "Defines product requirements and roadmap", "casual", "direct", "medium"),
    AgentRole("business_analyst", "Business Analyst", "Analyzes business processes and requirements", "formal", "diplomatic", "long"),
]

_INDEX: dict[str, AgentRole] = {r.id: r for r in _ROLES}


def get_role(role_id: str) -> AgentRole | None:
    """Get a role by ID."""
    return _INDEX.get(role_id)


def get_all_roles() -> list[AgentRole]:
    """Get all 27 built-in roles."""
    return list(_ROLES)


def infer_role(description: str) -> AgentRole | None:
    """Infer the best role from a description."""
    desc = description.lower()
    for role in _ROLES:
        if role.id in desc or role.name.lower() in desc:
            return role
    # Keyword matching
    keywords = {
        "research": "researcher", "search": "researcher", "browse": "browser",
        "code": "coder", "develop": "coder", "program": "coder",
        "write": "writer", "draft": "writer", "report": "writer",
        "analyz": "analyst", "data": "data_scientist",
        "design": "designer", "ui": "designer", "ux": "designer",
        "test": "qa_tester", "qa": "qa_tester",
        "review": "reviewer", "audit": "security_auditor",
        "deploy": "devops", "infra": "it_infrastructure",
        "manag": "project_manager", "plan": "project_manager",
        "legal": "legal", "finance": "finance", "budget": "finance",
        "sales": "sales", "market": "marketing", "email": "email_specialist",
        "support": "customer_support", "product": "product_manager",
    }
    for keyword, role_id in keywords.items():
        if keyword in desc:
            return _INDEX.get(role_id)
    return _INDEX.get("researcher")