
            <div class="box-header">
			<h2 align="center" font-weight=" bold">Gönderilmiş Mesajlar</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  
                  <th bgcolor="#99ccff">Adı Soyadı</th>
                  <th bgcolor="#99ccff">Mail Adresi</th>
				  <th bgcolor="#99ccff">Mesaj</th>
				  <th bgcolor="#99ccff">Tarih</th>
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				foreach($veri as $rs)
				{
                ?>
				
				
				<tr>
                  
                  <td><?=$rs->adsoy?></td>
                  <td><?=$rs->email?></td>
	
				  <td><?=$rs->mesaj?></td>
		
				  <td><?=$rs->tarih?></td>
				  
				 
				 
				 <td>
                    <div class="btn-group">
					
                    
                    <a href ="<?=base_url() ?>admin/mesajlar/g_delete/<?=$rs->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
				  
                </tr>
				
				
				
				
				
				 <?php
				}
                ?>
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
         

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
