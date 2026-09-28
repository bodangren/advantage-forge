# Reorders queue.tsv round-robin by model so every model gets turns. Run only while the scheduler is stopped.
from collections import OrderedDict
rows = [l for l in open('queue.tsv') if l.strip()]
order = ['coding-plan/kimi-k2.8-preview', 'kimi-code-plan-cn/kimi-for-coding', 'volcengine-agent-plan/kimi-k2.8-preview',
         'xai/grok-4.7', 'volcengine-agent-plan/glm-5.3-flash', 'deepseek/deepseek-flash']
by = OrderedDict((m, []) for m in order)
other = []
for l in rows:
    (by.get(l.split('\t')[1], other)).append(l)
out = []
while any(by.values()):
    for m in order:
        if by[m]:
            out.append(by[m].pop(0))
open('queue.tsv.next', 'w').write(''.join(out + other))
print('interleaved', len(rows))
