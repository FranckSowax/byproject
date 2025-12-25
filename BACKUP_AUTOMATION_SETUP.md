# 🔄 Configuration du Backup Automatique

**Date**: 8 Novembre 2025  
**Version**: 1.0

---

## 🎯 Objectif

Configurer un système de backup automatique quotidien pour la base de données Supabase.

---

## 📋 Options de Backup Automatique

### **Option 1: Supabase Built-in Backups (Recommandé)**

**Avantages:**
- ✅ Automatique et géré par Supabase
- ✅ Point-in-Time Recovery (PITR) disponible
- ✅ Pas de configuration nécessaire
- ✅ Stockage sécurisé

**Limitations:**
- ⚠️ Disponible uniquement sur plan Pro ($25/mois)
- ⚠️ Rétention limitée (7 jours par défaut)

**Configuration:**
1. Upgrade vers Supabase Pro
2. Activer les backups automatiques dans le dashboard
3. Configurer la rétention (7-30 jours)

**Dashboard Supabase:**
```
Settings → Database → Backups
- Enable automatic backups: ON
- Retention period: 30 days
- Backup time: 02:00 UTC
```

---

### **Option 2: GitHub Actions (Gratuit)**

**Avantages:**
- ✅ Gratuit
- ✅ Contrôle total
- ✅ Stockage sur GitHub ou S3
- ✅ Notifications personnalisables

**Configuration:**

**Fichier:** `.github/workflows/database-backup.yml`

```yaml
name: Database Backup

on:
  schedule:
    # Tous les jours à 02:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permet déclenchement manuel

env:
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  SUPABASE_DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Create backup
        run: |
          BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
          
          PGPASSWORD=${{ secrets.SUPABASE_DB_PASSWORD }} pg_dump \
            -h ${{ secrets.SUPABASE_DB_HOST }} \
            -U postgres \
            -d postgres \
            --no-owner \
            --no-acl \
            --clean \
            --if-exists \
            -f $BACKUP_NAME
          
          # Compresser
          gzip $BACKUP_NAME
          
          echo "BACKUP_FILE=${BACKUP_NAME}.gz" >> $GITHUB_ENV
      
      - name: Calculate checksum
        run: |
          md5sum ${{ env.BACKUP_FILE }} > ${{ env.BACKUP_FILE }}.md5
      
      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: database-backup-${{ github.run_number }}
          path: |
            ${{ env.BACKUP_FILE }}
            ${{ env.BACKUP_FILE }}.md5
          retention-days: 30
      
      - name: Upload to S3 (Optional)
        if: ${{ secrets.AWS_ACCESS_KEY_ID }}
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: eu-west-1
        run: |
          aws s3 cp ${{ env.BACKUP_FILE }} \
            s3://byproject-backups/$(date +%Y/%m)/${{ env.BACKUP_FILE }}
          
          aws s3 cp ${{ env.BACKUP_FILE }}.md5 \
            s3://byproject-backups/$(date +%Y/%m)/${{ env.BACKUP_FILE }}.md5
      
      - name: Log backup to database
        run: |
          BACKUP_SIZE=$(stat -f%z "${{ env.BACKUP_FILE }}" 2>/dev/null || stat -c%s "${{ env.BACKUP_FILE }}")
          BACKUP_SIZE_MB=$(echo "scale=2; $BACKUP_SIZE / 1024 / 1024" | bc)
          CHECKSUM=$(cat ${{ env.BACKUP_FILE }}.md5 | awk '{print $1}')
          
          # Insérer dans database_backups via API
          curl -X POST https://byproject.netlify.app/api/admin/backups/log \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d "{
              \"name\": \"${{ env.BACKUP_FILE }}\",
              \"backup_type\": \"automatic\",
              \"status\": \"completed\",
              \"size_bytes\": $BACKUP_SIZE,
              \"size_formatted\": \"${BACKUP_SIZE_MB} MB\",
              \"storage_path\": \"github-actions/${{ github.run_number }}\",
              \"checksum\": \"$CHECKSUM\"
            }"
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '❌ Database backup failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Notify on success
        if: success()
        run: |
          echo "✅ Backup completed successfully: ${{ env.BACKUP_FILE }}"
```

**Secrets à configurer dans GitHub:**
```
SUPABASE_PROJECT_ID=ebmgtfftimezuuxxzyjm
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_HOST=db.ebmgtfftimezuuxxzyjm.supabase.co
ADMIN_API_KEY=your_admin_api_key
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
SLACK_WEBHOOK=optional
```

---

### **Option 3: Netlify Scheduled Functions**

**Avantages:**
- ✅ Intégré à Netlify
- ✅ Pas de configuration externe
- ✅ Logs centralisés

**Fichier:** `netlify/functions/scheduled-backup.ts`

```typescript
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const handler = schedule('0 2 * * *', async (event) => {
  console.log('Starting automatic database backup...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // 1. Créer le backup via pg_dump
    const backupName = `backup_${new Date().toISOString().split('T')[0]}.sql`;
    
    const { stdout } = await execAsync(`
      PGPASSWORD=${process.env.SUPABASE_DB_PASSWORD} pg_dump \
        -h ${process.env.SUPABASE_DB_HOST} \
        -U postgres \
        -d postgres \
        --no-owner \
        --no-acl \
        -f /tmp/${backupName}
    `);
    
    // 2. Compresser
    await execAsync(`gzip /tmp/${backupName}`);
    
    // 3. Calculer checksum
    const { stdout: checksum } = await execAsync(`md5sum /tmp/${backupName}.gz`);
    
    // 4. Uploader vers Supabase Storage
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(`/tmp/${backupName}.gz`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(`${new Date().getFullYear()}/${backupName}.gz`, fileBuffer, {
        contentType: 'application/gzip',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    // 5. Logger dans database_backups
    const fileStats = fs.statSync(`/tmp/${backupName}.gz`);
    
    const { error: logError } = await supabase
      .from('database_backups')
      .insert({
        name: backupName,
        backup_type: 'automatic',
        status: 'completed',
        size_bytes: fileStats.size,
        size_formatted: `${(fileStats.size / 1024 / 1024).toFixed(2)} MB`,
        storage_path: uploadData.path,
        storage_provider: 'supabase',
        checksum: checksum.split(' ')[0],
        retention_days: 30
      });
    
    if (logError) throw logError;
    
    // 6. Nettoyer
    fs.unlinkSync(`/tmp/${backupName}.gz`);
    
    // 7. Logger dans system_logs
    await supabase
      .from('system_logs')
      .insert({
        level: 'success',
        category: 'backup',
        message: 'Backup automatique créé avec succès',
        details: {
          backup_name: backupName,
          size_mb: (fileStats.size / 1024 / 1024).toFixed(2),
          storage_path: uploadData.path
        }
      });
    
    console.log('✅ Backup completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        backup: backupName,
        size: fileStats.size
      })
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    
    // Logger l'erreur
    await supabase
      .from('system_logs')
      .insert({
        level: 'error',
        category: 'backup',
        message: 'Échec du backup automatique',
        stack_trace: error.stack,
        details: {
          error: error.message
        }
      });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
});
```

**Configuration Netlify:**
```toml
# netlify.toml
[functions]
  directory = "netlify/functions"
  
[[functions."scheduled-backup"]]
  schedule = "0 2 * * *"
```

---

### **Option 4: Cron Job sur Serveur**

**Pour un serveur dédié:**

**Fichier:** `/etc/cron.d/supabase-backup`

```bash
# Backup quotidien à 02:00 UTC
0 2 * * * root /usr/local/bin/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1
```

**Script:** `/usr/local/bin/supabase-backup.sh`

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/supabase"
RETENTION_DAYS=30
DB_HOST="db.ebmgtfftimezuuxxzyjm.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
S3_BUCKET="s3://byproject-backups"

# Créer le répertoire si nécessaire
mkdir -p $BACKUP_DIR

# Nom du backup
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Créer le backup
echo "Creating backup: $BACKUP_NAME"
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f $BACKUP_PATH

# Vérifier le succès
if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully"
  
  # Compresser
  gzip $BACKUP_PATH
  BACKUP_PATH="${BACKUP_PATH}.gz"
  
  # Calculer checksum
  md5sum $BACKUP_PATH > "${BACKUP_PATH}.md5"
  
  # Uploader vers S3 (optionnel)
  if [ ! -z "$S3_BUCKET" ]; then
    aws s3 cp $BACKUP_PATH $S3_BUCKET/$(date +%Y/%m)/
    aws s3 cp "${BACKUP_PATH}.md5" $S3_BUCKET/$(date +%Y/%m)/
  fi
  
  # Nettoyer les vieux backups
  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  find $BACKUP_DIR -name "backup_*.sql.gz.md5" -mtime +$RETENTION_DAYS -delete
  
  echo "✅ Backup process completed"
else
  echo "❌ Backup failed"
  exit 1
fi
```

**Rendre exécutable:**
```bash
chmod +x /usr/local/bin/supabase-backup.sh
```

---

## 📊 Monitoring des Backups

### **Dashboard Admin**

**Page:** `/admin/database` → Tab "Backups"

**Métriques affichées:**
- Dernier backup (date/heure)
- Taille totale des backups
- Nombre de backups disponibles
- Taux de succès (%)
- Prochain backup prévu

### **Alertes**

**Créer une alerte si backup échoue:**

```sql
-- Fonction pour vérifier les backups quotidiens
CREATE OR REPLACE FUNCTION check_daily_backup()
RETURNS void AS $$
DECLARE
  last_backup_date DATE;
  alert_exists BOOLEAN;
BEGIN
  -- Récupérer la date du dernier backup automatique
  SELECT DATE(created_at) INTO last_backup_date
  FROM database_backups
  WHERE backup_type = 'automatic'
  AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si pas de backup aujourd'hui, créer une alerte
  IF last_backup_date < CURRENT_DATE THEN
    -- Vérifier si alerte existe déjà
    SELECT EXISTS (
      SELECT 1 FROM system_alerts
      WHERE alert_type = 'backup_missing'
      AND resolved_at IS NULL
      AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO system_alerts (
        severity,
        title,
        description,
        alert_type,
        details
      ) VALUES (
        'critical',
        'Backup quotidien manquant',
        'Aucun backup automatique n''a été créé aujourd''hui',
        'backup_missing',
        jsonb_build_object(
          'last_backup_date', last_backup_date,
          'days_since_backup', CURRENT_DATE - last_backup_date
        )
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Exécuter quotidiennement à 14:00:**
```sql
-- Via cron ou scheduled function
SELECT check_daily_backup();
```

---

## ✅ Checklist de Configuration

### **Avant de Commencer**
- [ ] Choisir la méthode de backup (Supabase Pro, GitHub Actions, Netlify, Cron)
- [ ] Définir la fréquence (quotidien recommandé)
- [ ] Définir la rétention (30 jours recommandé)
- [ ] Choisir le stockage (Supabase Storage, S3, GitHub)

### **Configuration**
- [ ] Configurer les secrets/variables d'environnement
- [ ] Tester le backup manuellement
- [ ] Vérifier le fichier de backup
- [ ] Tester la restauration
- [ ] Configurer les alertes

### **Monitoring**
- [ ] Vérifier les logs quotidiennement (première semaine)
- [ ] Configurer notifications en cas d'échec
- [ ] Tester la restauration mensuellement
- [ ] Documenter la procédure

---

## 🧪 Test du Backup

### **Test Manuel**

**Via GitHub Actions:**
```bash
# Déclencher manuellement
gh workflow run database-backup.yml
```

**Via Netlify:**
```bash
# Déclencher via API
curl -X POST https://api.netlify.com/api/v1/sites/SITE_ID/functions/scheduled-backup/trigger \
  -H "Authorization: Bearer NETLIFY_TOKEN"
```

### **Vérification**

```bash
# 1. Vérifier que le fichier existe
ls -lh backup_*.sql.gz

# 2. Vérifier le checksum
md5sum -c backup_*.sql.gz.md5

# 3. Tester la décompression
gunzip -t backup_*.sql.gz

# 4. Tester la restauration (sur BDD de test)
gunzip backup_*.sql.gz
psql -h localhost -U postgres -d test_db -f backup_*.sql
```

---

## 📚 Ressources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)

---

**Recommandation:** Utiliser **GitHub Actions** pour commencer (gratuit, simple), puis migrer vers **Supabase Pro** en production pour bénéficier du PITR. 🔄✅
