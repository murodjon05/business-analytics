import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import ErpSnapshot, AnalysisResult
from .serializers import (
    ErpSnapshotSerializer, 
    AnalysisResultSerializer, 
    AnalysisRequestSerializer
)
from .tasks import run_analysis_chain
from .auth import generate_token, require_api_auth

logger = logging.getLogger(__name__)


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def login(request):
    """
    POST /api/auth/login/
    """
    email = request.data.get('email', '')
    password = request.data.get('password', '')

    if email == settings.ADMIN_EMAIL and password == settings.ADMIN_PASSWORD:
        token = generate_token(email)
        return Response({'token': token, 'email': email}, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@require_api_auth
def analyze_erp_data(request):
    """
    POST /api/analyze/
    
    Accepts ERP data and triggers async analysis.
    Returns task ID for polling.
    """
    serializer = AnalysisRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create ERP snapshot with flexible schema support
        if 'raw_data' in serializer.validated_data:
            erp_data = serializer.validated_data['raw_data']
        else:
            erp_data = {
                'sales': serializer.validated_data.get('sales', {}),
                'warehouse': serializer.validated_data.get('warehouse', {}),
                'finance': serializer.validated_data.get('finance', {}),
                'crm': serializer.validated_data.get('crm', {}),
            }
        
        snapshot = ErpSnapshot.objects.create(raw_data=erp_data)
        
        # Create analysis result record
        analysis = AnalysisResult.objects.create(
            erp_snapshot=snapshot,
            status='pending',
            name=serializer.validated_data.get('name', '')
        )
        
        # Trigger async analysis
        task = run_analysis_chain.delay(snapshot.id)
        
        logger.info(f"Analysis task {task.id} created for snapshot {snapshot.id}")
        
        return Response({
            'message': 'Analysis started successfully',
            'task_id': task.id,
            'analysis_id': analysis.id,
            'snapshot_id': snapshot.id,
            'status': 'pending'
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error creating analysis: {e}")
        return Response(
            {'error': 'Failed to start analysis', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@require_api_auth
def get_analysis_result(request, analysis_id):
    """
    GET /api/results/<id>/
    
    Returns analysis status and results if complete.
    """
    try:
        analysis = AnalysisResult.objects.get(id=analysis_id)
        serializer = AnalysisResultSerializer(analysis)
        
        return Response(serializer.data)
        
    except AnalysisResult.DoesNotExist:
        return Response(
            {'error': 'Analysis not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error retrieving analysis {analysis_id}: {e}")
        return Response(
            {'error': 'Failed to retrieve analysis', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@require_api_auth
def list_analyses(request):
    """
    GET /api/analyses/
    
    List all analyses with optional filtering.
    """
    try:
        status_filter = request.query_params.get('status', None)
        
        analyses = AnalysisResult.objects.all().order_by('-created_at')
        
        if status_filter:
            analyses = analyses.filter(status=status_filter)
        
        serializer = AnalysisResultSerializer(analyses, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error listing analyses: {e}")
        return Response(
            {'error': 'Failed to list analyses', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@require_api_auth
def delete_analysis(request, analysis_id):
    """
    DELETE /api/analyses/<id>/
    
    Delete an analysis and its underlying ERP snapshot.
    """
    try:
        analysis = AnalysisResult.objects.get(id=analysis_id)
        analysis.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except AnalysisResult.DoesNotExist:
        return Response(
            {'error': 'Analysis not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting analysis {analysis_id}: {e}")
        return Response(
            {'error': 'Failed to delete analysis', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
