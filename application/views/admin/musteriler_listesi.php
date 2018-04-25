
        <div class="col-xs-12">
          <div class="box">
            <div class="box-header">
			
              <h2 align="center" font-weight=" bold">Müşteriler Tablosu</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              <div class="box-tools">
                
              </div>
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  <th bgcolor="#99ccff">Sıra No</th>
                  <th bgcolor="#99ccff">Adı Soyadı</th>
				  <th bgcolor="#99ccff">Yetki</th>
				  <th bgcolor="#99ccff">Durum</th>
				  
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				foreach($veri as $rs)
				{
                ?>
				
				
				<tr>
                  <td> <?=++$i?></td>
                  <td><?=$rs->AdiSoyadi?></td>
                  
				  
				 <td><?=$rs->yetki?></td>
				 <td><span class="label label-success"><?=$rs->durum?></span></td>
				 
				 <td>
                    <div class="btn-group">
					<a href ="<?=base_url() ?>admin/musteriler/edit/<?=$rs->Id ?>"><button type="button" class="btn btn-default"  >Düzenle</button></a>
                    <a href ="<?=base_url() ?>admin/musteriler/preview/<?=$rs->Id ?>"> <button type="button" class="btn btn-info" data-toggle="modal" data-target="#modal-default"> Görüntüle    </button></a>
           
                    <a href ="<?=base_url() ?>admin/musteriler/delete/<?=$rs->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
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
          </div>
          <!-- /.box -->
        </div>

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
