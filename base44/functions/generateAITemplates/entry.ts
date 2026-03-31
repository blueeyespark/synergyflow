import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectType } = await req.json();
    
    const typeDescriptions = {
      marketing: 'multi-channel marketing campaign with social, email, and content planning',
      product: 'product launch including research, development, beta, and release phases',
      design: 'design system project with components, guidelines, and documentation',
      engineering: 'engineering sprint with development, code review, testing, and deployment',
      sales: 'sales proposal project with research, proposal creation, and follow-up',
      hr: 'employee onboarding process including orientation, training, and integration',
      operations: 'operations management with process improvement and automation',
      content: 'content calendar with planning, creation, review, and publishing',
      qa: 'QA testing cycle including test planning, execution, and bug tracking',
      finance: 'financial planning and budgeting project',
      customer: 'customer success initiative with onboarding and support',
      infrastructure: 'infrastructure project with planning, implementation, and monitoring'
    };

    const description = typeDescriptions[projectType] || projectType;
    
    const prompt = `Generate a professional project template for a "${description}". Return JSON with:
    {
      "name": "Template name",
      "description": "Brief description",
      "category": "${projectType}",
      "tasks": [
        { "title": "Task 1", "description": "...", "priority": "high", "status": "todo" },
        { "title": "Task 2", "description": "...", "priority": "medium", "status": "todo" }
      ],
      "custom_statuses": [
        { "id": "s1", "name": "Status 1", "color": "#6366f1", "order": 0 }
      ]
    }
    Include 3-5 realistic tasks and 2-3 custom statuses. Make it production-ready.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          tasks: { type: "array" },
          custom_statuses: { type: "array" }
        }
      }
    });

    const templateData = typeof result === 'string' ? JSON.parse(result) : result;

    const template = await base44.entities.ProjectTemplate.create({
      ...templateData,
      is_public: false
    });

    return Response.json({ template });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});