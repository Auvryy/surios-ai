# SuriOS — System Goals and SDG Alignment

This document describes SuriOS's public purpose, current infrastructure scope, and a practical plan for evaluating its impact.

## 1. Mission

**SuriOS** (from Tagalog *suri* — to inspect, analyze, and appraise) helps communities document public infrastructure concerns and follow their progress with accountable public-sector updates. Its current geographic focus is Santa Cruz, Laguna (`14.2813° N, 121.4173° E`). The system combines location-tagged media, cautious AI triage, evidence-supported report grouping, and official status updates.

Road pavement is the first fully developed mapped workflow. The broader reporting and assessment scope includes:

| Infrastructure | Examples residents can report | Public value |
| :--- | :--- | :--- |
| **Bridges and footbridges** | Broken railings, cracked steps, or visible distress to supports | Bridges connect communities to services, jobs, and markets. |
| **Drainage and flood canals** | Collapsed canal walls, blocked drains, or missing covers | Maintained drainage supports resilient public infrastructure during heavy rain. |
| **Streetlights and utility poles** | Damaged fixtures or poles, dangling wires, or a reported lighting outage | Reliable lighting and utility infrastructure supports access and public services. An outage described in text remains unverified until checked. |
| **Water pipes and hydrants** | Visible leaks or damaged exposed pipe/hydrant components | Reporting can help locate maintenance needs; images alone do not establish the leak source or water quality. |
| **Telecom and fiber cables** | Low-hanging, tangled, or visibly broken cables and damaged poles | Communication infrastructure supports connectivity, including the intent of SDG Target 9.c. Photos cannot establish whether a cable is energized or identify its operator. |

The map uses OpenStreetMap road corridors and optional road-section lines for pavement reports. Other asset types use a point location. ASTM D6433 is a pavement condition standard and is not used to certify bridges, utilities, drainage, lighting, or telecommunications.

## 2. Sustainable Development Goal alignment

| Goal | Contribution SuriOS can support | Boundary |
| :--- | :--- | :--- |
| **SDG 9: Industry, Innovation, and Infrastructure** *(Primary)* | A shared way to record visible infrastructure defects, location, community evidence, and public response. Includes ICT-related telecom/fiber reports relevant to Target 9.c. | SuriOS reports and prioritizes concerns; qualified agencies inspect assets and decide maintenance. |
| **SDG 11: Sustainable Cities and Communities** *(Supporting)* | Better records of defects that may affect access to streets, bridges, footbridges, and drainage. | The project has not measured changes in crashes, travel time, or access outcomes. |
| **SDG 16: Peace, Justice, and Strong Institutions** *(Supporting)* | Linked official progress/resolution updates with explanations and available photo/document evidence. | An official status is a public record, not automated engineering certification. |

## 3. How the workflow helps

- Residents and staff attach photos/videos and an exact reported location.
- The assessment separates image-visible observations from unverified user statements. User text alone does not raise severity or establish an emergency.
- Severity uses a 1–10 triage scale. Critical scores (8–10) require clear visible serious danger and high confidence; localized minor defects can remain at 4 or lower when evidence supports that score.
- Nearby reports are grouped only when evidence supports the same physical issue. Community likes and confirmations do not increase physical damage severity.
- Official accounts can publish linked in-progress and resolved updates. Every linked post points to the government explanation for the shared report.

The model cannot infer hidden structural damage, service status, ownership, water quality, electrical energization, cause, or repair completion from appearance alone. Assessment results require qualified on-site review.

## 4. Pilot impact measures

SuriOS does not yet claim a quantified cost saving or reduction in incidents. A pilot can measure:

| Measure | What to record |
| :--- | :--- |
| **Time to acknowledgement** | Time from a public report to the first linked official update. |
| **Time to resolution** | Time from report to an official resolved status, including the posted explanation/evidence. |
| **Duplicate handling** | Reports linked as the same issue versus reports kept separate after review. |
| **Asset coverage** | Reports by supported infrastructure type and location. |
| **Assessment quality** | Agreement between AI triage and later qualified inspection, including score calibration. |

Pavement lifecycle costs can be evaluated separately using local engineering and procurement data. Road estimates should not be generalized to bridges, utilities, drainage, lighting, or telecom assets.

## 5. Presentation questions

1. **How do you limit unsupported AI conclusions?** Structured outputs are validated with Zod. Image-visible defects and unverified reporter claims are separate fields. Reporter text alone cannot support critical severity; critical scores require visible serious-danger evidence and high confidence. The result is triage, not a certified inspection.
2. **What if an upload is unrelated to public infrastructure?** The model checks for recognizable infrastructure in the media. If none is visible, the endpoint rejects it instead of creating a report.
3. **Which assets are in scope?** Pavement, bridges/footbridges, drainage/flood canals, streetlights/utility poles, water pipes/hydrants, and telecom/fiber. Road lines and road-section geometry apply only to road reports; other assets use point coordinates.
4. **How can residents see what happened?** Government accounts publish linked progress/resolution updates with explanations and available evidence. The report status opens that official post; it does not automatically certify repair quality.
