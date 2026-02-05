import logging
from celery import shared_task
from django.db import transaction
from .models import ErpSnapshot, AnalysisResult
from .services.ai_analyzer import AIAnalyzer

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def run_analysis_chain(self, snapshot_id):
    """
    Celery task to run the complete AI analysis chain.
    
    Steps:
    1. Data Quality Analysis
    2. Business Strategy Generation
    3. ERP Configuration Recommendations
    """
    try:
        with transaction.atomic():
            # Get the snapshot and analysis result
            snapshot = ErpSnapshot.objects.get(id=snapshot_id)
            analysis = AnalysisResult.objects.get(erp_snapshot=snapshot)
            
            # Update status to processing
            analysis.status = 'processing'
            analysis.save()
            
            logger.info(f"Starting analysis chain for snapshot {snapshot_id}")
            
            # Initialize AI analyzer
            analyzer = AIAnalyzer()
            
            # Run full analysis
            results = analyzer.run_full_analysis(snapshot.raw_data)
            
            # Save results
            analysis.cleaning_analysis = results['cleaning_analysis']
            analysis.business_strategy = results['business_strategy']
            analysis.erp_actions = results['erp_actions']
            analysis.status = 'completed'
            analysis.save()
            
            logger.info(f"Analysis completed for snapshot {snapshot_id}")
            
            return {
                'status': 'success',
                'analysis_id': analysis.id,
                'snapshot_id': snapshot_id
            }
            
    except ErpSnapshot.DoesNotExist:
        logger.error(f"ErpSnapshot {snapshot_id} not found")
        raise
    except Exception as exc:
        logger.error(f"Analysis failed for snapshot {snapshot_id}: {exc}")
        
        # Update status to failed
        try:
            analysis = AnalysisResult.objects.get(erp_snapshot_id=snapshot_id)
            analysis.status = 'failed'
            analysis.error_message = str(exc)
            analysis.save()
        except:
            pass
        
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))